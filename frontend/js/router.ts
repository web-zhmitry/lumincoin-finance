(window as any).routes = {};

const dynamicRoutes: string[] = ['main', 'income-categories', 'expense-categories', 'income-edit', 'expense-edit', 'income-expense', 'operation-create', 'operation-edit', 'income-create', 'expense-create'];

function addRoute(name: string, html: string): void {
    (window as any).routes[name] = html;
}

const protectedRoutes: string[] = [
    'main', 'income-expense', 'income-categories', 'expense-categories',
    'income-create', 'income-edit', 'expense-create', 'expense-edit',
    'operation-create', 'operation-edit'
];

async function renderPage(name: string, id: string | number | null = null): Promise<void> {
    const app = document.getElementById('app');
    if (!app) return;

    if (protectedRoutes.includes(name) && !isLoggedIn()) {
        window.location.hash = 'login';
        return;
    }

    if (!(window as any).routes[name] && !dynamicRoutes.includes(name)) {
        app.innerHTML = '<h2>Страница не найдена</h2>';
        return;
    }

    const sidebar = document.getElementById('sidebar');
    if (name === 'login' || name === 'register') {
        if (sidebar) sidebar.style.display = 'none';
        app.classList.add('vh-100');
    } else {
        if (sidebar) sidebar.style.display = 'flex';
        app.classList.remove('vh-100');
    }

    if (name === 'main') {
        app.innerHTML = (window as any).routes['main'];
        try {
            const operations = await getOperations('all');
            const incomeOps = operations.filter((op: any) => op.type === 'income');
            const expenseOps = operations.filter((op: any) => op.type === 'expense');
            setTimeout(() => initMainCharts(incomeOps, expenseOps), 200);
        } catch (error) {
            console.error('Ошибка графиков:', error);
        }
        window.location.hash = 'main';
        return;
    }

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

    if (name === 'income-expense') {
        try {
            const operations = await getOperations();
            app.innerHTML = getOperationsTemplate(operations);
            setTimeout(() => {
                const activeFilter = document.querySelector('#filterButtons .btn-filter.active');
                if (activeFilter && activeFilter.getAttribute('data-period') === 'interval') {
                    const df = document.getElementById('filterDateFrom') as HTMLInputElement;
                    const dt = document.getElementById('filterDateTo') as HTMLInputElement;
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

    if (name === 'operation-create') {
        const operationType = id || 'income';
        try {
            const incomeCategories = await getIncomeCategories();
            const expenseCategories = await getExpenseCategories();
            app.innerHTML = getOperationCreateTemplate(incomeCategories, expenseCategories, operationType as string);
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id || 'income'}`;
        return;
    }

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

    if (id) {
        window.location.hash = `${name}?id=${id}`;
    } else {
        window.location.hash = name;
    }

    app.innerHTML = (window as any).routes[name];
    window.location.hash = name;
}

document.addEventListener('DOMContentLoaded', function () {
    const fullHash = window.location.hash.substring(1);
    const [hash, query] = fullHash.split('?');
    const params = new URLSearchParams(query || '');
    const id = params.get('id');

    if (hash && ((window as any).routes[hash] || dynamicRoutes.includes(hash))) {
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

    // Обновляем баланс и имя пользователя после загрузки
    if (isLoggedIn()) {
        updateBalance();
        updateUserName();
    }
});

window.addEventListener('hashchange', async function () {
    const fullHash = window.location.hash.substring(1);
    const [hash, query] = fullHash.split('?');
    const params = new URLSearchParams(query || '');
    const id = params.get('id');

    if (hash && ((window as any).routes[hash] || dynamicRoutes.includes(hash))) {
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

(window as any).renderPage = renderPage;