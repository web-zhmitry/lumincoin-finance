const API_URL = 'http://localhost:3000/api';

// ==================== ТИПЫ ДЛЯ DOM ====================
function getInput(id: string): HTMLInputElement {
    return document.getElementById(id) as HTMLInputElement;
}
function getSelect(id: string): HTMLSelectElement {
    return document.getElementById(id) as HTMLSelectElement;
}
function getTextarea(id: string): HTMLTextAreaElement {
    return document.getElementById(id) as HTMLTextAreaElement;
}
function target<T extends HTMLElement = HTMLElement>(e: Event): T {
    return e.target as T;
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
(window as any).editOperation = function(id: number) {
    (window as any).renderPage('operation-edit', id);
};
(window as any).logout = function() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
function isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
}

// ==================== ОШИБКИ ПОД ПОЛЕМ ====================
function showError(inputElement: HTMLElement, message: string): void {
    const oldFeedback = inputElement.parentElement?.querySelector('.invalid-feedback');
    if (oldFeedback) oldFeedback.remove();
    inputElement.classList.add('is-invalid');
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    inputElement.after(feedback);
}

function clearErrors(formElement: HTMLElement): void {
    formElement.querySelectorAll('.is-invalid').forEach((input: Element) => input.classList.remove('is-invalid'));
    formElement.querySelectorAll('.invalid-feedback').forEach((fb: Element) => fb.remove());
}

// ==================== ЗАПРОСЫ ====================
async function request(url: string, method: string = 'GET', body: object | null = null): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('accessToken');
    if (token) headers['x-auth-token'] = token;

    let response = await fetch(API_URL + url, { method, headers, body: body ? JSON.stringify(body) : null });

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
                response = await fetch(API_URL + url, { method, headers, body: body ? JSON.stringify(body) : null });
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

async function getIncomeCategories(): Promise<any[]> {
    return await request('/categories/income', 'GET');
}

async function getExpenseCategories(): Promise<any[]> {
    return await request('/categories/expense', 'GET');
}

async function login(email: string, password: string, rememberMe: boolean): Promise<any> {
    const data = await request('/login', 'POST', { email, password, rememberMe });
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
}

async function signup(name: string, lastName: string, email: string, password: string, passwordRepeat: string): Promise<any> {
    await request('/signup', 'POST', { name, lastName, email, password, passwordRepeat });
    return await login(email, password, false);
}

// ==================== ВЫХОД ====================
function logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ==================== ДЕЛЕГИРОВАННЫЕ ОБРАБОТЧИКИ ====================
document.addEventListener('click', async function (e: Event) {
    const t = target(e);

    // Кнопка логина
    if (t.id === 'loginBtn') {
        e.preventDefault();
        const form = document.getElementById('loginForm');
        if (!form) return;
        clearErrors(form);
        const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
        const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;
        const rememberMe = (document.getElementById('rememberMe') as HTMLInputElement)?.checked || false;
        try {
            await login(emailInput.value, passwordInput.value, rememberMe);
            window.location.href = 'index.html';
        } catch (error: any) {
            showError(emailInput, error.message);
            showError(passwordInput, error.message);
        }
    }

    // Кнопка регистрации
    if (t.id === 'registerBtn') {
        e.preventDefault();
        const form = document.getElementById('registerForm');
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
        } catch (error: any) {
            showError(emailInput, error.message);
            showError(passwordInput, error.message);
        }
    }

    // Ссылка "Пройдите регистрацию"
    if (t.getAttribute('href') === '#register') {
        e.preventDefault();
        renderPage('register');
    }

    // Ссылка "Войдите в систему"
    if (t.getAttribute('href') === '#login') {
        e.preventDefault();
        renderPage('login');
    }

    // Создание категории доходов
    if (t.id === 'createIncomeCategoryBtn') {
        e.preventDefault();
        const titleInput = getInput('incomeCategoryTitle');
        if (!titleInput.value.trim()) {
            alert('Введите название категории');
            return;
        }
        try {
            await request('/categories/income', 'POST', { title: titleInput.value.trim() });
            renderPage('income-categories');
        } catch (error: any) {
            alert('Ошибка создания категории: ' + error.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Создание категории расходов
    if (t.id === 'createExpenseCategoryBtn') {
        e.preventDefault();
        const titleInput = getInput('expenseCategoryTitle');
        if (!titleInput.value.trim()) {
            alert('Введите название категории');
            return;
        }
        try {
            await request('/categories/expense', 'POST', { title: titleInput.value.trim() });
            renderPage('expense-categories');
        } catch (error: any) {
            alert('Ошибка создания категории: ' + error.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Обновление категории доходов
    if (t.id === 'updateIncomeCategoryBtn') {
        e.preventDefault();
        const id = t.getAttribute('data-id');
        const titleInput = getInput('editIncomeCategoryTitle');
        if (!titleInput.value.trim()) {
            alert('Введите название');
            return;
        }
        try {
            await request('/categories/income/' + id, 'PUT', { title: titleInput.value.trim() });
            renderPage('income-categories');
        } catch (error: any) {
            alert('Ошибка: ' + error.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Обновление категории расходов
    if (t.id === 'updateExpenseCategoryBtn') {
        e.preventDefault();
        const id = t.getAttribute('data-id');
        const titleInput = getInput('editExpenseCategoryTitle');
        if (!titleInput.value.trim()) {
            alert('Введите название');
            return;
        }
        try {
            await request('/categories/expense/' + id, 'PUT', { title: titleInput.value.trim() });
            renderPage('expense-categories');
        } catch (error: any) {
            alert('Ошибка: ' + error.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Удаление категории
    if (t.id === 'confirmDeleteCategory') {
        const modal = document.getElementById('deleteCategoryModal') as HTMLElement;
        const categoryId = modal.getAttribute('data-category-id');
        const isIncome = modal.getAttribute('data-category-type') === 'income';
        const url = isIncome ? '/categories/income/' : '/categories/expense/';
        try {
            await request(url + categoryId, 'DELETE');
            const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            renderPage(isIncome ? 'income-categories' : 'expense-categories');
        } catch (error: any) {
            alert('Ошибка удаления: ' + error.message);
        }
        if (isLoggedIn()) updateBalance();
    }

    // Переключение категорий при смене типа операции
    if (t.id === 'operationType') {
        const type = (t as HTMLSelectElement).value;
        const categorySelect = getSelect('operationCategory');
        if (!categorySelect) return;
        try {
            const categories = type === 'income' ? await getIncomeCategories() : await getExpenseCategories();
            categorySelect.innerHTML = categories.map((c: any) => `<option value="${c.id}">${c.title}</option>`).join('');
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    // Создание операции
    if (t.id === 'createOperationBtn') {
        e.preventDefault();
        const type = getSelect('operationType').value;
        const category_id = parseInt(getSelect('operationCategory').value);
        const amount = parseFloat(getInput('operationAmount').value);
        const date = getInput('operationDate').value;
        const comment = getTextarea('operationComment').value;

        if (!amount || !date) {
            alert('Заполните сумму и дату');
            return;
        }
        try {
            await request('/operations', 'POST', { type, category_id, amount, date, comment });
            renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error: any) {
            alert('Ошибка создания операции: ' + error.message);
        }
    }

    // Обновление операции
    if (t.id === 'updateOperationBtn') {
        e.preventDefault();
        const id = t.getAttribute('data-id');
        const type = getSelect('editOperationType').value;
        const category_id = parseInt(getSelect('editOperationCategory').value);
        const amount = parseFloat(getInput('editOperationAmount').value);
        const date = getInput('editOperationDate').value;
        const comment = getTextarea('editOperationComment').value;

        if (!amount || !date) {
            alert('Заполните сумму и дату');
            return;
        }
        try {
            await request('/operations/' + id, 'PUT', { type, category_id, amount, date, comment });
            renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error: any) {
            alert('Ошибка обновления операции: ' + error.message);
        }
    }

    // Ссылки с data-route
    if (t.classList.contains('dynamic-link')) {
        e.preventDefault();
        const route = t.getAttribute('data-route');
        const id = t.getAttribute('data-id');
        renderPage(route, id);
    }

    // Удаление операции
    if (t.id === 'confirmDeleteOperation') {
        const modal = document.getElementById('deleteOperationModal') as HTMLElement;
        const operationId = modal.getAttribute('data-operation-id');
        try {
            await request('/operations/' + operationId, 'DELETE');
            const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error: any) {
            alert('Ошибка удаления операции: ' + error.message);
        }
    }

    // Фильтр операций
    if ((t.closest('#filterButtons') || t.closest('#mainFilterButtons')) && t.classList.contains('btn-filter')) {
        e.preventDefault();
        const container = t.closest('#filterButtons') || t.closest('#mainFilterButtons');
        container!.querySelectorAll('.btn-filter').forEach((btn: Element) => btn.classList.remove('active'));
        t.classList.add('active');
        const period = t.getAttribute('data-period');

        const dateFrom = container!.querySelector('input[type="date"]:first-of-type') as HTMLInputElement;
        const dateTo = container!.querySelector('input[type="date"]:last-of-type') as HTMLInputElement;
        if (dateFrom && dateTo) {
            dateFrom.disabled = period !== 'interval';
            dateTo.disabled = period !== 'interval';
        }

        try {
            if (period === 'interval') {
                const df = document.getElementById('filterDateFrom') as HTMLInputElement || document.getElementById('mainDateFrom') as HTMLInputElement;
                const dt = document.getElementById('filterDateTo') as HTMLInputElement || document.getElementById('mainDateTo') as HTMLInputElement;
                if (!df || !dt || !df.value || !dt.value) return;
            }

            const operations = await getOperations(period!);
            if (container!.id === 'mainFilterButtons') {
                const incomeOps = operations.filter((op: any) => op.type === 'income');
                const expenseOps = operations.filter((op: any) => op.type === 'expense');
                initMainCharts(incomeOps, expenseOps);
            } else {
                document.getElementById('app')!.innerHTML = getOperationsTemplate(operations);
                if (period === 'interval') {
                    setTimeout(() => {
                        const df = getInput('filterDateFrom');
                        const dt = getInput('filterDateTo');
                        df.disabled = false;
                        dt.disabled = false;
                    }, 50);
                }
            }
        } catch (error: any) {
            alert('Ошибка: ' + error.message);
        }
    }

    // Изменение дат в фильтре интервала
    if (t.id === 'filterDateFrom' || t.id === 'filterDateTo' || t.id === 'mainDateFrom' || t.id === 'mainDateTo') {
        const dateFrom = getInput('filterDateFrom') || getInput('mainDateFrom');
        const dateTo = getInput('filterDateTo') || getInput('mainDateTo');
        if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
            try {
                const operations = await getOperations('interval', dateFrom.value, dateTo.value);
                if (t.id.startsWith('main')) {
                    const incomeOps = operations.filter((op: any) => op.type === 'income');
                    const expenseOps = operations.filter((op: any) => op.type === 'expense');
                    initMainCharts(incomeOps, expenseOps);
                } else {
                    document.getElementById('app')!.innerHTML = getOperationsTemplate(operations);
                }
            } catch (error: any) {
                alert('Ошибка: ' + error.message);
            }
        }
    }
});

// Обработчик изменения дат
document.addEventListener('change', async function(e: Event) {
    const t = target(e);
    if (t.id === 'filterDateFrom' || t.id === 'filterDateTo' || t.id === 'mainDateFrom' || t.id === 'mainDateTo') {
        const isMain = t.id.startsWith('main');
        const dateFrom = getInput(isMain ? 'mainDateFrom' : 'filterDateFrom');
        const dateTo = getInput(isMain ? 'mainDateTo' : 'filterDateTo');
        if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
            try {
                const operations = await getOperations('interval', dateFrom.value, dateTo.value);
                if (isMain) {
                    const incomeOps = operations.filter((op: any) => op.type === 'income');
                    const expenseOps = operations.filter((op: any) => op.type === 'expense');
                    initMainCharts(incomeOps, expenseOps);
                } else {
                    document.getElementById('app')!.innerHTML = getOperationsTemplate(operations);
                }
            } catch (error: any) {
                alert('Ошибка: ' + error.message);
            }
        }
    }
});

// При открытии модалки
document.addEventListener('show.bs.modal', function (e: any) {
    if (e.target.id === 'deleteCategoryModal') {
        const button = e.relatedTarget as HTMLElement;
        e.target.setAttribute('data-category-id', button.getAttribute('data-category-id'));
        e.target.setAttribute('data-category-type', button.getAttribute('data-category-type'));
    }
    if (e.target.id === 'deleteOperationModal') {
        const button = e.relatedTarget as HTMLElement;
        e.target.setAttribute('data-operation-id', button.getAttribute('data-operation-id'));
    }
});

// ==================== ГРАФИКИ ====================
function initMainCharts(incomeOps: any[], expenseOps: any[]): void {
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0d6efd', '#6f42c1', '#d63384', '#198754', '#0dcaf0'];

    try {
        const oldIncome = (window as any).Chart.getChart('incomeChart');
        const oldExpense = (window as any).Chart.getChart('expenseChart');
        if (oldIncome) oldIncome.destroy();
        if (oldExpense) oldExpense.destroy();
    } catch (e) {}

    const incomeCtx = (document.getElementById('incomeChart') as HTMLCanvasElement)?.getContext('2d');
    const expenseCtx = (document.getElementById('expenseChart') as HTMLCanvasElement)?.getContext('2d');

    if (incomeCtx) {
        new (window as any).Chart(incomeCtx, {
            type: 'pie',
            data: {
                labels: incomeOps?.length ? incomeOps.map((op: any) => op.category || 'Без категории') : ['Нет данных'],
                datasets: [{ data: incomeOps?.length ? incomeOps.map((op: any) => op.amount) : [0], backgroundColor: colors.slice(0, incomeOps?.length || 1) }]
            }
        });
    }
    if (expenseCtx) {
        new (window as any).Chart(expenseCtx, {
            type: 'pie',
            data: {
                labels: expenseOps?.length ? expenseOps.map((op: any) => op.category || 'Без категории') : ['Нет данных'],
                datasets: [{ data: expenseOps?.length ? expenseOps.map((op: any) => op.amount) : [0], backgroundColor: colors.slice(0, expenseOps?.length || 1) }]
            }
        });
    }
}

// ==================== МЕНЮ ПОЛЬЗОВАТЕЛЯ ====================
document.addEventListener('DOMContentLoaded', function () {
    const userMenuLink = document.getElementById('userMenuLink');
    const userMenu = document.getElementById('userMenu');
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
        const t = target(e);
        if (userMenu && !t.closest('#userMenuLink') && !t.closest('#userMenu')) {
            userMenu.style.display = 'none';
        }
    });

    const logoutLink = document.querySelector('#userMenu a');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e: Event) {
            e.preventDefault();
            logout();
        });
    }
});

// ==================== ДАТЫ ====================
async function getOperations(period: string = 'all', dateFrom: string | null = null, dateTo: string | null = null): Promise<any[]> {
    let query = `?period=${period}`;
    if (period === 'interval' && dateFrom && dateTo) {
        query += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    }
    return await request('/operations' + query, 'GET');
}

// ==================== БАЛАНС ====================
async function updateBalance(): Promise<void> {
    try {
        const data = await request('/balance', 'GET');
        const balanceElement = document.querySelector('#sidebar .text-primary');
        if (balanceElement) {
            balanceElement.textContent = data.balance + '$';
        }
    } catch (error) {
        console.error('Ошибка обновления баланса:', error);
    }
}

// ==================== ИМЯ В САЙДБАРЕ ====================
function updateUserName(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
        const user = JSON.parse(userData);
        const nameElement = document.getElementById('userName');
        if (nameElement) {
            nameElement.textContent = `${user.name} ${user.lastName}`;
        }
    }
}