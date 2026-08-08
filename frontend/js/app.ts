const API_URL = 'http://localhost:3000/api';

// ==================== ТИПЫ ====================
interface Category {
    id: number;
    title: string;
}

interface Operation {
    id: number;
    type: 'income' | 'expense';
    category: string;
    category_id: number;
    amount: number;
    date: string;
    comment: string;
}

interface ChartData {
    category: string;
    amount: number;
}

interface ChartInstance {
    destroy: () => void;
}

interface ChartConstructor {
    new (ctx: CanvasRenderingContext2D, config: {
        type: string;
        data: {
            labels: string[];
            datasets: Array<{
                data: number[];
                backgroundColor: string[];
            }>;
        };
    }): ChartInstance;
    getChart: (id: string) => ChartInstance | undefined;
}

interface RequestHeaders {
    'Content-Type': string;
    'x-auth-token'?: string;
}

interface LoginData {
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    user: {
        name: string;
        lastName: string;
        id: number;
    };
}

interface BalanceData {
    balance: number;
}

interface UserData {
    name: string;
    lastName: string;
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
(window as unknown as { editOperation: (id: number) => void }).editOperation = function(id: number): void {
    (window as unknown as { renderPage: (name: string, id: number | null) => void }).renderPage('operation-edit', id);
};

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
export function isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
}

(window as unknown as { isLoggedIn: () => boolean }).isLoggedIn = isLoggedIn;

// ==================== ОШИБКИ ПОД ПОЛЕМ ====================
export function showError(inputElement: HTMLElement, message: string): void {
    const parent = inputElement.parentElement;
    if (!parent) return;
    const oldFeedback = parent.querySelector('.invalid-feedback');
    if (oldFeedback) oldFeedback.remove();
    inputElement.classList.add('is-invalid');
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    inputElement.after(feedback);
}

export function clearErrors(formElement: HTMLElement): void {
    formElement.querySelectorAll('.is-invalid').forEach((input: Element) => input.classList.remove('is-invalid'));
    formElement.querySelectorAll('.invalid-feedback').forEach((fb: Element) => fb.remove());
}

// ==================== ЗАПРОСЫ ====================
export async function request(url: string, method: string = 'GET', body: object | null = null): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('accessToken');
    if (token) headers['x-auth-token'] = token;

    let response = await fetch(API_URL + url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            const refreshResponse = await fetch(API_URL + '/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('accessToken', refreshData.tokens.accessToken);
                localStorage.setItem('refreshToken', refreshData.tokens.refreshToken);
                headers['x-auth-token'] = refreshData.tokens.accessToken;
                response = await fetch(API_URL + url, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : null
                });
            } else {
                logout();
                throw new Error('Сессия истекла, войдите заново');
            }
        } else {
            logout();
            throw new Error('Сессия истекла, войдите заново');
        }
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
    return data;
}

export async function getIncomeCategories(): Promise<Category[]> {
    return await request('/categories/income', 'GET') as Category[];
}

export async function getExpenseCategories(): Promise<Category[]> {
    return await request('/categories/expense', 'GET') as Category[];
}

export async function login(email: string, password: string, rememberMe: boolean): Promise<LoginData> {
    const data = await request('/login', 'POST', { email, password, rememberMe }) as LoginData;
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
}

export async function signup(name: string, lastName: string, email: string, password: string, passwordRepeat: string): Promise<LoginData> {
    await request('/signup', 'POST', { name, lastName, email, password, passwordRepeat });
    return await login(email, password, false);
}

// ==================== ВЫХОД ====================
export function logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ==================== ДЕЛЕГИРОВАННЫЕ ОБРАБОТЧИКИ ====================
document.addEventListener('click', async function (e: Event) {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Кнопка логина
    if (target.id === 'loginBtn') {
        e.preventDefault();
        const form = document.getElementById('loginForm') as HTMLFormElement;
        if (!form) return;
        clearErrors(form);
        const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
        const rememberMe = (document.getElementById('rememberMe') as HTMLInputElement)?.checked || false;
        try {
            await login(emailInput.value, passwordInput.value, rememberMe);
            window.location.href = 'index.html';
        } catch (error: unknown) {
            const err = error as Error;
            showError(emailInput, err.message);
            showError(passwordInput, err.message);
        }
    }

    // Кнопка регистрации
    if (target.id === 'registerBtn') {
        e.preventDefault();
        const form = document.getElementById('registerForm') as HTMLFormElement;
        if (!form) return;
        clearErrors(form);
        const nameInput = form.querySelector('input[placeholder="Имя"]') as HTMLInputElement;
        const lastNameInput = form.querySelector('input[placeholder="Фамилия"]') as HTMLInputElement;
        const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInputs = form.querySelectorAll('input[type="password"]');
        const passwordInput = passwordInputs[0] as HTMLInputElement;
        const passwordRepeatInput = passwordInputs[1] as HTMLInputElement;
        if (passwordInput.value !== passwordRepeatInput.value) {
            showError(passwordRepeatInput, 'Пароли не совпадают');
            return;
        }
        try {
            await signup(nameInput.value, lastNameInput.value, emailInput.value, passwordInput.value, passwordRepeatInput.value);
            window.location.href = 'index.html';
        } catch (error: unknown) {
            const err = error as Error;
            showError(emailInput, err.message);
            showError(passwordInput, err.message);
        }
    }

    // Ссылка "Пройдите регистрацию"
    if (target.getAttribute('href') === '#register') {
        e.preventDefault();
        (window as unknown as { renderPage: (name: string) => void }).renderPage('register');
    }

    // Ссылка "Войдите в систему"
    if (target.getAttribute('href') === '#login') {
        e.preventDefault();
        (window as unknown as { renderPage: (name: string) => void }).renderPage('login');
    }

    // Создание категории доходов
    if (target.id === 'createIncomeCategoryBtn') {
        e.preventDefault();
        const titleInput = document.getElementById('incomeCategoryTitle') as HTMLInputElement;
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название категории');
            return;
        }
        try {
            await request('/categories/income', 'POST', { title: titleInput.value.trim() });
            (window as unknown as { renderPage: (name: string) => void }).renderPage('income-categories');
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка создания категории: ' + err.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Создание категории расходов
    if (target.id === 'createExpenseCategoryBtn') {
        e.preventDefault();
        const titleInput = document.getElementById('expenseCategoryTitle') as HTMLInputElement;
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название категории');
            return;
        }
        try {
            await request('/categories/expense', 'POST', { title: titleInput.value.trim() });
            (window as unknown as { renderPage: (name: string) => void }).renderPage('expense-categories');
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка создания категории: ' + err.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Обновление категории доходов
    if (target.id === 'updateIncomeCategoryBtn') {
        e.preventDefault();
        const id = target.getAttribute('data-id');
        const titleInput = document.getElementById('editIncomeCategoryTitle') as HTMLInputElement;
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название');
            return;
        }
        try {
            await request('/categories/income/' + id, 'PUT', { title: titleInput.value.trim() });
            (window as unknown as { renderPage: (name: string) => void }).renderPage('income-categories');
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка: ' + err.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Обновление категории расходов
    if (target.id === 'updateExpenseCategoryBtn') {
        e.preventDefault();
        const id = target.getAttribute('data-id');
        const titleInput = document.getElementById('editExpenseCategoryTitle') as HTMLInputElement;
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название');
            return;
        }
        try {
            await request('/categories/expense/' + id, 'PUT', { title: titleInput.value.trim() });
            (window as unknown as { renderPage: (name: string) => void }).renderPage('expense-categories');
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка: ' + err.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Удаление категории
    if (target.id === 'confirmDeleteCategory') {
        const modal = document.getElementById('deleteCategoryModal') as HTMLElement;
        const categoryId = modal.getAttribute('data-category-id');
        const isIncome = modal.getAttribute('data-category-type') === 'income';
        const url = isIncome ? '/categories/income/' : '/categories/expense/';
        try {
            await request(url + categoryId, 'DELETE');
            const bsModal = (window as unknown as { bootstrap: { Modal: { getInstance: (el: HTMLElement) => { hide: () => void } } } }).bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            (window as unknown as { renderPage: (name: string) => void }).renderPage(isIncome ? 'income-categories' : 'expense-categories');
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка удаления: ' + err.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Переключение категорий при смене типа операции
    if (target.id === 'operationType') {
        const type = (target as HTMLSelectElement).value;
        const categorySelect = document.getElementById('operationCategory') as HTMLSelectElement;
        if (!categorySelect) return;
        try {
            const categories: Category[] = type === 'income' ? await getIncomeCategories() : await getExpenseCategories();
            categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    // Создание операции
    if (target.id === 'createOperationBtn') {
        e.preventDefault();
        const type = (document.getElementById('operationType') as HTMLSelectElement).value;
        const category_id = parseInt((document.getElementById('operationCategory') as HTMLSelectElement).value);
        const amount = parseFloat((document.getElementById('operationAmount') as HTMLInputElement).value);
        const date = (document.getElementById('operationDate') as HTMLInputElement).value;
        const comment = (document.getElementById('operationComment') as HTMLTextAreaElement).value;

        if (!amount || !date) {
            alert('Заполните сумму и дату');
            return;
        }
        try {
            await request('/operations', 'POST', { type, category_id, amount, date, comment });
            (window as unknown as { renderPage: (name: string) => void }).renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка создания операции: ' + err.message);
        }
    }

    // Обновление операции
    if (target.id === 'updateOperationBtn') {
        e.preventDefault();
        const id = target.getAttribute('data-id');
        const type = (document.getElementById('editOperationType') as HTMLSelectElement).value;
        const category_id = parseInt((document.getElementById('editOperationCategory') as HTMLSelectElement).value);
        const amount = parseFloat((document.getElementById('editOperationAmount') as HTMLInputElement).value);
        const date = (document.getElementById('editOperationDate') as HTMLInputElement).value;
        const comment = (document.getElementById('editOperationComment') as HTMLTextAreaElement).value;

        if (!amount || !date) {
            alert('Заполните сумму и дату');
            return;
        }
        try {
            await request('/operations/' + id, 'PUT', { type, category_id, amount, date, comment });
            (window as unknown as { renderPage: (name: string) => void }).renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка обновления операции: ' + err.message);
        }
    }

    // Удаление операции
    if (target.id === 'confirmDeleteOperation') {
        const modal = document.getElementById('deleteOperationModal') as HTMLElement;
        const operationId = modal.getAttribute('data-operation-id');
        try {
            await request('/operations/' + operationId, 'DELETE');
            const bsModal = (window as unknown as { bootstrap: { Modal: { getInstance: (el: HTMLElement) => { hide: () => void } } } }).bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            (window as unknown as { renderPage: (name: string) => void }).renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка удаления операции: ' + err.message);
        }
    }

    // Фильтр операций
    if ((target.closest('#filterButtons') || target.closest('#mainFilterButtons')) && target.classList.contains('btn-filter')) {
        e.preventDefault();
        const container = (target.closest('#filterButtons') || target.closest('#mainFilterButtons')) as HTMLElement;
        container.querySelectorAll('.btn-filter').forEach((btn: Element) => btn.classList.remove('active'));
        target.classList.add('active');
        const period = target.getAttribute('data-period') as string;

        const dateFrom = container.querySelector('input[type="date"]:first-of-type') as HTMLInputElement;
        const dateTo = container.querySelector('input[type="date"]:last-of-type') as HTMLInputElement;
        if (dateFrom && dateTo) {
            dateFrom.disabled = period !== 'interval';
            dateTo.disabled = period !== 'interval';
        }

        try {
            if (period === 'interval') {
                const df = (document.getElementById('filterDateFrom') || document.getElementById('mainDateFrom')) as HTMLInputElement;
                const dt = (document.getElementById('filterDateTo') || document.getElementById('mainDateTo')) as HTMLInputElement;
                if (!df || !dt || !df.value || !dt.value) return;
            }

            const operations: Operation[] = await getOperations(period) as Operation[];
            if (container.id === 'mainFilterButtons') {
                const incomeOps = operations.filter(op => op.type === 'income');
                const expenseOps = operations.filter(op => op.type === 'expense');
                initMainCharts(incomeOps, expenseOps);
            } else {
                (window as unknown as { renderPage: (name: string, id: string) => void }).renderPage('income-expense', period);
            }
        } catch (error: unknown) {
            const err = error as Error;
            alert('Ошибка: ' + err.message);
        }
    }

    // Изменение дат в фильтре интервала
    if (target.id === 'filterDateFrom' || target.id === 'filterDateTo' || target.id === 'mainDateFrom' || target.id === 'mainDateTo') {
        const dateFrom = (document.getElementById('filterDateFrom') || document.getElementById('mainDateFrom')) as HTMLInputElement;
        const dateTo = (document.getElementById('filterDateTo') || document.getElementById('mainDateTo')) as HTMLInputElement;
        if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
            try {
                const operations: Operation[] = await getOperations('interval', dateFrom.value, dateTo.value) as Operation[];
                if (target.id.startsWith('main')) {
                    const incomeOps = operations.filter(op => op.type === 'income');
                    const expenseOps = operations.filter(op => op.type === 'expense');
                    initMainCharts(incomeOps, expenseOps);
                } else {
                    (document.getElementById('app') as HTMLElement).innerHTML = getOperationsTemplate(operations);
                }
            } catch (error: unknown) {
                const err = error as Error;
                alert('Ошибка: ' + err.message);
            }
        }
    }
});

// Обработчик изменения дат в фильтре интервала
document.addEventListener('change', async function(e: Event) {
    const target = e.target as HTMLElement;
    if (!target) return;

    if (target.id === 'filterDateFrom' || target.id === 'filterDateTo' ||
        target.id === 'mainDateFrom' || target.id === 'mainDateTo') {

        const isMain = target.id.startsWith('main');
        const dateFrom = document.getElementById(isMain ? 'mainDateFrom' : 'filterDateFrom') as HTMLInputElement;
        const dateTo = document.getElementById(isMain ? 'mainDateTo' : 'filterDateTo') as HTMLInputElement;

        if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
            try {
                const operations: Operation[] = await getOperations('interval', dateFrom.value, dateTo.value) as Operation[];
                if (isMain) {
                    const incomeOps = operations.filter(op => op.type === 'income');
                    const expenseOps = operations.filter(op => op.type === 'expense');
                    initMainCharts(incomeOps, expenseOps);
                } else {
                    (document.getElementById('app') as HTMLElement).innerHTML = getOperationsTemplate(operations);
                }
            } catch (error: unknown) {
                const err = error as Error;
                alert('Ошибка: ' + err.message);
            }
        }
    }
});

// При открытии модалки удаления - сохраняем id и тип
document.addEventListener('show.bs.modal', function (e: Event) {
    const target = e.target as HTMLElement;
    if (!target) return;

    if (target.id === 'deleteCategoryModal') {
        const button = (e as unknown as { relatedTarget: HTMLElement }).relatedTarget;
        target.setAttribute('data-category-id', button.getAttribute('data-category-id') as string);
        target.setAttribute('data-category-type', button.getAttribute('data-category-type') as string);
    }
    if (target.id === 'deleteOperationModal') {
        const button = (e as unknown as { relatedTarget: HTMLElement }).relatedTarget;
        target.setAttribute('data-operation-id', button.getAttribute('data-operation-id') as string);
    }
});

// ==================== ГРАФИКИ ====================
export function initMainCharts(incomeOps: ChartData[], expenseOps: ChartData[]): void {
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0d6efd', '#6f42c1', '#d63384', '#198754', '#0dcaf0'];
    const Chart = (window as unknown as { Chart: ChartConstructor }).Chart;

    try {
        const oldIncome = Chart.getChart('incomeChart');
        const oldExpense = Chart.getChart('expenseChart');
        if (oldIncome) oldIncome.destroy();
        if (oldExpense) oldExpense.destroy();
    } catch (e) {}

    const incomeCtx = (document.getElementById('incomeChart') as HTMLCanvasElement)?.getContext('2d');
    const expenseCtx = (document.getElementById('expenseChart') as HTMLCanvasElement)?.getContext('2d');

    if (incomeCtx) {
        new Chart(incomeCtx, {
            type: 'pie',
            data: {
                labels: incomeOps.length ? incomeOps.map(op => op.category || 'Без категории') : ['Нет данных'],
                datasets: [{
                    data: incomeOps.length ? incomeOps.map(op => op.amount) : [0],
                    backgroundColor: colors.slice(0, incomeOps.length || 1)
                }]
            }
        });
    }
    if (expenseCtx) {
        new Chart(expenseCtx, {
            type: 'pie',
            data: {
                labels: expenseOps.length ? expenseOps.map(op => op.category || 'Без категории') : ['Нет данных'],
                datasets: [{
                    data: expenseOps.length ? expenseOps.map(op => op.amount) : [0],
                    backgroundColor: colors.slice(0, expenseOps.length || 1)
                }]
            }
        });
    }
}

// ==================== МЕНЮ ПОЛЬЗОВАТЕЛЯ ====================
document.addEventListener('DOMContentLoaded', function () {
    const userMenuLink = document.getElementById('userMenuLink') as HTMLAnchorElement;
    const userMenu = document.getElementById('userMenu') as HTMLElement;
    if (userMenu) userMenu.style.display = 'none';

    if (userMenuLink) {
        userMenuLink.addEventListener('click', function (event: Event) {
            event.preventDefault();
            event.stopPropagation();
            if (userMenu) {
                userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    document.addEventListener('click', function (e: Event) {
        const target = e.target as HTMLElement;
        if (userMenu && !target.closest('#userMenuLink') && !target.closest('#userMenu')) {
            userMenu.style.display = 'none';
        }
    });

    // Кнопка "выйти"
    const logoutLink = document.querySelector('#userMenu a') as HTMLAnchorElement;
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e: Event) {
            e.preventDefault();
            logout();
        });
    }
});

// ==================== ШАБЛОН ДЛЯ ОПЕРАЦИЙ ====================
export function getOperationsTemplate(operations: Operation[]): string {
    const sortedOps = [...operations].sort((a, b) => a.id - b.id);
    const rowsHtml = sortedOps.map(op => `
        <tr style="border-bottom: 1px solid #D9D9D9;">
            <td class="fw-medium">${op.id}</td>
            <td style="color: ${op.type === 'income' ? '#198754' : '#dc3545'};">
                ${op.type === 'income' ? 'доход' : 'расход'}
            </td>
            <td>${op.category || 'Без категории'}</td>
            <td>${op.amount}$</td>
            <td>${op.date}</td>
            <td>${op.comment || ''}</td>
            <td class="text-end">
                <a href="javascript:void(0)" onclick="window.editOperation(${op.id})" class="me-3" style="text-decoration: none;">✏️</a>
                <a href="#" data-bs-toggle="modal" data-bs-target="#deleteOperationModal" data-operation-id="${op.id}" style="text-decoration: none;">🗑️</a>
            </td>
        </tr>
    `).join('');

    return rowsHtml || '<tr><td colspan="7" class="text-center">Нет операций</td></tr>';
}

// ==================== ДАТЫ ====================
export async function getOperations(period: string = 'all', dateFrom: string | null = null, dateTo: string | null = null): Promise<Operation[]> {
    let query = `?period=${period}`;
    if (period === 'interval' && dateFrom && dateTo) {
        query += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    }
    return await request('/operations' + query, 'GET') as Operation[];
}

// ==================== БАЛАНС ====================
export async function updateBalance(): Promise<void> {
    try {
        const data = await request('/balance', 'GET') as BalanceData;
        const balanceElement = document.querySelector('#sidebar .text-primary') as HTMLElement;
        if (balanceElement) {
            balanceElement.textContent = data.balance + '$';
        }
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
    }
}

// ==================== ИМЯ В САЙДБАРЕ ====================
export function updateUserName(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
        const user: UserData = JSON.parse(userData);
        const nameElement = document.getElementById('userName') as HTMLElement;
        if (nameElement) {
            nameElement.textContent = `${user.name} ${user.lastName}`;
        }
    }
}