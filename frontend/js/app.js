const API_URL = 'http://localhost:3000/api';
window.editOperation = function(id) {
    renderPage('operation-edit', id);
};


// ==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================
function isLoggedIn() {
    return !!localStorage.getItem('accessToken');
}

// ==================== ОШИБКИ ПОД ПОЛЕМ ====================
function showError(inputElement, message) {
    const oldFeedback = inputElement.parentElement.querySelector('.invalid-feedback');
    if (oldFeedback) oldFeedback.remove();
    inputElement.classList.add('is-invalid');
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    inputElement.after(feedback);
}

function clearErrors(formElement) {
    formElement.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
    formElement.querySelectorAll('.invalid-feedback').forEach(fb => fb.remove());
}

// ==================== ЗАПРОСЫ ====================
async function request(url, method = 'GET', body = null) {
    const headers = {'Content-Type': 'application/json'};
    let token = localStorage.getItem('accessToken');
    if (token) headers['x-auth-token'] = token;

    let response = await fetch(API_URL + url, {method, headers, body: body ? JSON.stringify(body) : null});

    // если токен истёк - пробуем обновить
    if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            const refreshResponse = await fetch(API_URL + '/refresh', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({refreshToken})
            });
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                localStorage.setItem('accessToken', refreshData.tokens.accessToken);
                localStorage.setItem('refreshToken', refreshData.tokens.refreshToken);
                // повторяем исходный запрос с новым токеном
                headers['x-auth-token'] = refreshData.tokens.accessToken;
                response = await fetch(API_URL + url, {method, headers, body: body ? JSON.stringify(body) : null});
            } else {
                // рефреш не сработал — выходим
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

// получить категории доходов
async function getIncomeCategories() {
    return await request('/categories/income', 'GET');
}

// получить категории расходов
async function getExpenseCategories() {
    return await request('/categories/expense', 'GET');
}

async function login(email, password, rememberMe) {
    const data = await request('/login', 'POST', {email, password, rememberMe});
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
}

async function signup(name, lastName, email, password, passwordRepeat) {
    await request('/signup', 'POST', {name, lastName, email, password, passwordRepeat});
    return await login(email, password, false);
}

// ==================== ВЫХОД ====================
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ==================== ДЕЛЕГИРОВАННЫЕ ОБРАБОТЧИКИ ====================
document.addEventListener('click', async function (e) {
    // Кнопка логина
    if (e.target && e.target.id === 'loginBtn') {
        e.preventDefault();
        const form = document.getElementById('loginForm');
        if (!form) return;
        clearErrors(form);
        const emailInput = form.querySelector('input[type="email"]');
        const passwordInput = form.querySelector('input[type="password"]');
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        try {
            await login(emailInput.value, passwordInput.value, rememberMe);
            window.location.href = 'index.html';
        } catch (error) {
            showError(emailInput, error.message);
            showError(passwordInput, error.message);
        }
    }

    // кнопка регистрации
    if (e.target && e.target.id === 'registerBtn') {
        e.preventDefault();
        const form = document.getElementById('registerForm');
        if (!form) return;
        clearErrors(form);
        const nameInput = form.querySelector('input[placeholder="Имя"]');
        const lastNameInput = form.querySelector('input[placeholder="Фамилия"]');
        const emailInput = form.querySelector('input[type="email"]');
        const passwordInputs = form.querySelectorAll('input[type="password"]');
        const passwordInput = passwordInputs[0];
        const passwordRepeatInput = passwordInputs[1];
        if (passwordInput.value !== passwordRepeatInput.value) {
            showError(passwordRepeatInput, 'Пароли не совпадают');
            return;
        }
        try {
            await signup(nameInput.value, lastNameInput.value, emailInput.value, passwordInput.value, passwordRepeatInput.value);
            window.location.href = 'index.html';
        } catch (error) {
            showError(emailInput, error.message);
            showError(passwordInput, error.message);
        }
    }

    // ссылка "Пройдите регистрацию"
    if (e.target && e.target.getAttribute('href') === '#register') {
        e.preventDefault();
        renderPage('register');
    }

    // ссылка "Войдите в систему"
    if (e.target && e.target.getAttribute('href') === '#login') {
        e.preventDefault();
        renderPage('login');
    }

    // создание категории доходов
    if (e.target && e.target.id === 'createIncomeCategoryBtn') {
        e.preventDefault();
        const titleInput = document.getElementById('incomeCategoryTitle');
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название категории');
            return;
        }
        try {
            await request('/categories/income', 'POST', {title: titleInput.value.trim()});
            renderPage('income-categories');
        } catch (error) {
            alert('Ошибка создания категории: ' + error.message);
        }

        if (isLoggedIn()) {
            updateBalance();
        }
    }

    // создание категории расходов
    if (e.target && e.target.id === 'createExpenseCategoryBtn') {
        e.preventDefault();
        const titleInput = document.getElementById('expenseCategoryTitle');
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название категории');
            return;
        }
        try {
            await request('/categories/expense', 'POST', {title: titleInput.value.trim()});
            renderPage('expense-categories');
        } catch (error) {
            alert('Ошибка создания категории: ' + error.message);
        }

        if (isLoggedIn()) {
            updateBalance();
        }
    }

    // обновление категории доходов
    if (e.target && e.target.id === 'updateIncomeCategoryBtn') {
        e.preventDefault();
        const id = e.target.getAttribute('data-id');
        const titleInput = document.getElementById('editIncomeCategoryTitle');
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название');
            return;
        }
        try {
            await request('/categories/income/' + id, 'PUT', {title: titleInput.value.trim()});
            renderPage('income-categories');
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }

        if (isLoggedIn()) {
            updateBalance();
        }
    }

    // обновление категории расходов
    if (e.target && e.target.id === 'updateExpenseCategoryBtn') {
        e.preventDefault();
        const id = e.target.getAttribute('data-id');
        const titleInput = document.getElementById('editExpenseCategoryTitle');
        if (!titleInput || !titleInput.value.trim()) {
            alert('Введите название');
            return;
        }
        try {
            await request('/categories/expense/' + id, 'PUT', {title: titleInput.value.trim()});
            renderPage('expense-categories');
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }

        if (isLoggedIn()) {
            updateBalance();
        }
    }

    // удаление категории (подтверждение в модальном окне)
    if (e.target && e.target.id === 'confirmDeleteCategory') {
        const modal = document.getElementById('deleteCategoryModal');
        const categoryId = modal.getAttribute('data-category-id');
        const isIncome = modal.getAttribute('data-category-type') === 'income';
        const url = isIncome ? '/categories/income/' : '/categories/expense/';
        try {
            await request(url + categoryId, 'DELETE');
            // закрываем модальное окно
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            // обновляем список
            renderPage(isIncome ? 'income-categories' : 'expense-categories');
        } catch (error) {
            alert('Ошибка удаления: ' + error.message);
        }

        if (isLoggedIn()) {
            updateBalance();
        }
    }

    // переключение категорий при смене типа операции
    if (e.target && e.target.id === 'operationType') {
        const type = e.target.value;
        const categorySelect = document.getElementById('operationCategory');
        if (!categorySelect) return;
        try {
            const categories = type === 'income' ? await getIncomeCategories() : await getExpenseCategories();
            categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }

        if (isLoggedIn()) {
            updateBalance();
        }
    }

    // создание операции
    if (e.target && e.target.id === 'createOperationBtn') {
        e.preventDefault();
        const type = document.getElementById('operationType').value;
        const category_id = parseInt(document.getElementById('operationCategory').value);
        const amount = parseFloat(document.getElementById('operationAmount').value);
        const date = document.getElementById('operationDate').value;
        const comment = document.getElementById('operationComment').value;

        if (!amount || !date) {
            alert('Заполните сумму и дату');
            return;
        }
        try {
            await request('/operations', 'POST', { type, category_id, amount, date, comment });
            renderPage('income-expense');
            setTimeout(updateBalance, 300);

        } catch (error) {
            alert('Ошибка создания операции: ' + error.message);
        }
    }

    // обновление операции
    if (e.target && e.target.id === 'updateOperationBtn') {
        e.preventDefault();
        const id = e.target.getAttribute('data-id');
        const type = document.getElementById('editOperationType').value;
        const category_id = parseInt(document.getElementById('editOperationCategory').value);
        const amount = parseFloat(document.getElementById('editOperationAmount').value);
        const date = document.getElementById('editOperationDate').value;
        const comment = document.getElementById('editOperationComment').value;

        if (!amount || !date) {
            alert('Заполните сумму и дату');
            return;
        }
        try {
            await request('/operations/' + id, 'PUT', { type, category_id, amount, date, comment });
            renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error) {
            alert('Ошибка обновления операции: ' + error.message);
        }
    }

    // ссылки с data-route
    if (e.target && e.target.classList.contains('dynamic-link')) {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        const id = e.target.getAttribute('data-id');
        renderPage(route, id);
    }

    // удаление операции
    if (e.target && e.target.id === 'confirmDeleteOperation') {
        const modal = document.getElementById('deleteOperationModal');
        const operationId = modal.getAttribute('data-operation-id');
        try {
            await request('/operations/' + operationId, 'DELETE');
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            renderPage('income-expense');
            setTimeout(updateBalance, 300);
        } catch (error) {
            alert('Ошибка удаления операции: ' + error.message);
        }
    }

    // фильтр операций
    if (e.target && (e.target.closest('#filterButtons') || e.target.closest('#mainFilterButtons')) && e.target.classList.contains('btn-filter')) {
        e.preventDefault();
        const container = e.target.closest('#filterButtons') || e.target.closest('#mainFilterButtons');
        container.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        const period = e.target.getAttribute('data-period');

        // включаем/выключаем поля дат
        const dateFrom = container.querySelector('input[type="date"]:first-of-type');
        const dateTo = container.querySelector('input[type="date"]:last-of-type');
        if (dateFrom && dateTo) {
            dateFrom.disabled = period !== 'interval';
            dateTo.disabled = period !== 'interval';
        }

        try {
            // Если выбран интервал, но даты не выбраны — ничего не делаем
            if (period === 'interval') {
                const df = document.getElementById('filterDateFrom') || document.getElementById('mainDateFrom');
                const dt = document.getElementById('filterDateTo') || document.getElementById('mainDateTo');
                if (!df || !dt || !df.value || !dt.value) {
                    return; // просто активируем поля и ждём выбора дат
                }
            }

            const operations = await getOperations(period);
            if (container.id === 'mainFilterButtons') {
                const incomeOps = operations.filter(op => op.type === 'income');
                const expenseOps = operations.filter(op => op.type === 'expense');
                initMainCharts(incomeOps, expenseOps);
            } else {
                document.getElementById('app').innerHTML = getOperationsTemplate(operations);
                // Включаем поля дат, если выбран интервал
                if (period === 'interval') {
                    setTimeout(() => {
                        const df = document.getElementById('filterDateFrom');
                        const dt = document.getElementById('filterDateTo');
                        if (df) df.disabled = false;
                        if (dt) dt.disabled = false;
                    }, 50);
                }
            }

            // Если выбран интервал, но даты не выбраны — ничего не делаем
            if (period === 'interval') {
                const df = document.getElementById('filterDateFrom') || document.getElementById('mainDateFrom');
                const dt = document.getElementById('filterDateTo') || document.getElementById('mainDateTo');
                if (!df || !dt || !df.value || !dt.value) {
                    // Включаем поля и ждём выбора дат
                    if (df) df.disabled = false;
                    if (dt) dt.disabled = false;
                    return;
                }
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }

    // изменение дат в фильтре интервала
    if (e.target && (e.target.id === 'filterDateFrom' || e.target.id === 'filterDateTo' || e.target.id === 'mainDateFrom' || e.target.id === 'mainDateTo')) {
        const dateFrom = document.getElementById('filterDateFrom') || document.getElementById('mainDateFrom');
        const dateTo = document.getElementById('filterDateTo') || document.getElementById('mainDateTo');
        if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
            try {
                const operations = await getOperations('interval', dateFrom.value, dateTo.value);
                if (e.target.id.startsWith('main')) {
                    const incomeOps = operations.filter(op => op.type === 'income');
                    const expenseOps = operations.filter(op => op.type === 'expense');
                    initMainCharts(incomeOps, expenseOps);
                } else {
                    document.getElementById('app').innerHTML = getOperationsTemplate(operations);
                }
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        }
    }
});

// обработчик изменения дат в фильтре интервала
document.addEventListener('change', async function(e) {
    if (e.target.id === 'filterDateFrom' || e.target.id === 'filterDateTo' ||
        e.target.id === 'mainDateFrom' || e.target.id === 'mainDateTo') {

        const isMain = e.target.id.startsWith('main');
        const dateFrom = document.getElementById(isMain ? 'mainDateFrom' : 'filterDateFrom');
        const dateTo = document.getElementById(isMain ? 'mainDateTo' : 'filterDateTo');

        if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
            try {
                const operations = await getOperations('interval', dateFrom.value, dateTo.value);
                if (isMain) {
                    const incomeOps = operations.filter(op => op.type === 'income');
                    const expenseOps = operations.filter(op => op.type === 'expense');
                    initMainCharts(incomeOps, expenseOps);
                } else {
                    document.getElementById('app').innerHTML = getOperationsTemplate(operations);
                }
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        }
    }
});

// при открытии модалки удаления категории - сохраняем id и тип
document.addEventListener('show.bs.modal', function (e) {
    if (e.target.id === 'deleteCategoryModal') {
        const button = e.relatedTarget;
        const categoryId = button.getAttribute('data-category-id');
        const categoryType = button.getAttribute('data-category-type');
        e.target.setAttribute('data-category-id', categoryId);
        e.target.setAttribute('data-category-type', categoryType);
    }
    if (e.target.id === 'deleteOperationModal') {
        const button = e.relatedTarget;
        const operationId = button.getAttribute('data-operation-id');
        e.target.setAttribute('data-operation-id', operationId);
    }
});

// ==================== ГРАФИКИ ====================
function initMainCharts(incomeOps, expenseOps) {
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0d6efd', '#6f42c1', '#d63384', '#198754', '#0dcaf0'];

    try {
        const oldIncome = Chart.getChart('incomeChart');
        const oldExpense = Chart.getChart('expenseChart');
        if (oldIncome) oldIncome.destroy();
        if (oldExpense) oldExpense.destroy();
    } catch(e) {}

    const incomeCtx = document.getElementById('incomeChart')?.getContext('2d');
    const expenseCtx = document.getElementById('expenseChart')?.getContext('2d');

    if (incomeCtx) {
        new Chart(incomeCtx, {
            type: 'pie',
            data: {
                labels: incomeOps && incomeOps.length ? incomeOps.map(op => op.category || 'Без категории') : ['Нет данных'],
                datasets: [{ data: incomeOps && incomeOps.length ? incomeOps.map(op => op.amount) : [0], backgroundColor: colors.slice(0, incomeOps?.length || 1) }]
            }
        });
    }
    if (expenseCtx) {
        new Chart(expenseCtx, {
            type: 'pie',
            data: {
                labels: expenseOps && expenseOps.length ? expenseOps.map(op => op.category || 'Без категории') : ['Нет данных'],
                datasets: [{ data: expenseOps && expenseOps.length ? expenseOps.map(op => op.amount) : [0], backgroundColor: colors.slice(0, expenseOps?.length || 1) }]
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
        userMenuLink.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (userMenu) {
                userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    document.addEventListener('click', function (e) {
        if (userMenu && !e.target.closest('#userMenuLink') && !e.target.closest('#userMenu')) {
            userMenu.style.display = 'none';
        }
    });

    // кнопка "выйти"
    const logoutLink = document.querySelector('#userMenu a');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }
});

// ==================== ДАТЫ ====================
async function getOperations(period = 'all', dateFrom = null, dateTo = null) {
    let query = `?period=${period}`;
    if (period === 'interval' && dateFrom && dateTo) {
        query += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    }
    return await request('/operations' + query, 'GET');
}

// ==================== БАЛАНС ====================
async function updateBalance() {
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
function updateUserName() {
    const userData = localStorage.getItem('user');
    if (userData) {
        const user = JSON.parse(userData);
        const nameElement = document.getElementById('userName');
        if (nameElement) {
            nameElement.textContent = `${user.name} ${user.lastName}`;
        }
    }
}