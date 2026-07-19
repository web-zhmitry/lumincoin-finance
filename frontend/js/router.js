// хранилище шаблонов
window.routes = {};

const dynamicRoutes = ['main', 'income-categories', 'expense-categories', 'income-edit', 'expense-edit', 'income-expense', 'operation-create', 'operation-edit', 'income-create', 'expense-create'];

// функция для регистрации шаблона
function addRoute(name, html) {
    window.routes[name] = html;
}

// список страниц, доступных только авторизованным
const protectedRoutes = [
    'main',
    'income-expense',
    'income-categories',
    'expense-categories',
    'income-create',
    'income-edit',
    'expense-create',
    'expense-edit',
    'operation-create',
    'operation-edit'
];

// функция отрисовки страницы
async function renderPage(name, id = null) {
    const app = document.getElementById('app');
    if (!app) return;

    console.log('renderPage called:', name, id);

    // если страница защищённая, а пользователь не авторизован — редирект на логин
    if (protectedRoutes.includes(name) && !isLoggedIn()) {
        window.location.hash = 'login';
        return;
    }

    if (!window.routes[name] && !dynamicRoutes.includes(name)) {
        app.innerHTML = '<h2>Страница не найдена</h2>';
        return;
    }

    // прячем сайдбар на страницах логина и регистрации
    const sidebar = document.getElementById('sidebar');
    if (name === 'login' || name === 'register') {
        if (sidebar) sidebar.style.display = 'none';
        app.classList.add('vh-100');
    } else {
        if (sidebar) sidebar.style.display = 'flex';
        app.classList.remove('vh-100');
    }

    // блок main
    if (name === 'main') {
        app.innerHTML = window.routes['main'];
        try {
            const operations = await getOperations('all');
            const incomeOps = operations.filter(op => op.type === 'income');
            const expenseOps = operations.filter(op => op.type === 'expense');
            setTimeout(() => initMainCharts(incomeOps, expenseOps), 200);
        } catch (error) {
            console.error('Ошибка графиков:', error);
        }
        if (window.location.hash !== '#main') {
            window.location.hash = 'main';
        }
        return;
    }

    // если страница категорий доходов - грузим данные с сервера
    if (name === 'income-categories') {
        try {
            const categories = await getIncomeCategories();
            app.innerHTML = getIncomeCategoriesTemplate(categories);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = name;
        return;
    }

    // если страница категорий расходов - грузим данные с сервера
    if (name === 'expense-categories') {
        try {
            const categories = await getExpenseCategories();
            app.innerHTML = getExpenseCategoriesTemplate(categories);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = name;
        return;
    }

    // редактирование доходов
    if (name === 'income-edit' && id) {
        try {
            const category = await request('/categories/income/' + id, 'GET');
            app.innerHTML = getIncomeEditTemplate(category);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id}`;
        return;
    }

    // редактирование расходов
    if (name === 'expense-edit' && id) {
        try {
            const category = await request('/categories/expense/' + id, 'GET');
            app.innerHTML = getExpenseEditTemplate(category);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id}`;
        return;
    }

    // для загрузки операций
    if (name === 'income-expense') {
        try {
            const operations = await getOperations();
            app.innerHTML = getOperationsTemplate(operations);
            // Если выбран интервал — включаем поля дат
            setTimeout(() => {
                const activeFilter = document.querySelector('#filterButtons .btn-filter.active');
                if (activeFilter && activeFilter.getAttribute('data-period') === 'interval') {
                    const df = document.getElementById('filterDateFrom');
                    const dt = document.getElementById('filterDateTo');
                    if (df) df.disabled = false;
                    if (dt) dt.disabled = false;
                }
            }, 100);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = name;
        return;
    }

    // блок для operation-create
    if (name === 'operation-create') {
        const operationType = id || 'income';
        try {
            const incomeCategories = await getIncomeCategories();
            const expenseCategories = await getExpenseCategories();
            app.innerHTML = getOperationCreateTemplate(incomeCategories, expenseCategories, operationType);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id || 'income'}`;
        return;
    }

    // обработчик редактирования в доход/расход
    if (name === 'operation-edit' && id) {
        try {
            const operation = await request('/operations/' + id, 'GET');
            const incomeCategories = await getIncomeCategories();
            const expenseCategories = await getExpenseCategories();
            app.innerHTML = getOperationEditTemplate(operation, incomeCategories, expenseCategories);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id}`;
        return;
    }

    // сохраняем id в хеш, если он передан
    if (id) {
        window.location.hash = `${name}?id=${id}`;
    } else {
        window.location.hash = name;
    }

    app.innerHTML = window.routes[name];
    window.location.hash = name;
}

// при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const fullHash = window.location.hash.substring(1);
    const [hash, query] = fullHash.split('?');
    const params = new URLSearchParams(query || '');
    const id = params.get('id');

    if (hash && (window.routes[hash] || dynamicRoutes.includes(hash))) {
        if (protectedRoutes.includes(hash) && !isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        renderPage(hash, id);
    } else {
        if (isLoggedIn()) {
            renderPage('main');
        } else {
            window.location.href = 'login.html';
        }
    }

    if (isLoggedIn()) {
        updateBalance();
        updateUserName();
    }
});

// обработчик смены хеша
window.addEventListener('hashchange', async function() {
    const fullHash = window.location.hash.substring(1);
    const [hash, query] = fullHash.split('?');
    const params = new URLSearchParams(query || '');
    const id = params.get('id');

    if (hash && (window.routes[hash] || dynamicRoutes.includes(hash))) {
        if (protectedRoutes.includes(hash) && !isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        await renderPage(hash, id);
    } else if (!hash) {
        if (isLoggedIn()) {
            await renderPage('main');
        } else {
            window.location.href = 'login.html';
        }
    }
});