import { isLoggedIn, getIncomeCategories, getExpenseCategories, getOperations, initMainCharts, updateBalance, updateUserName, request, logout } from './app';

// Типы для данных API
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

// Хранилище шаблонов
(window as unknown as { routes: Record<string, string> }).routes = {};

// Загрузить шаблон из файла
async function loadTemplate(name: string): Promise<string> {
    const response = await fetch(`/templates/${name}.html`);
    if (!response.ok) {
        throw new Error(`Шаблон ${name} не найден`);
    }
    return await response.text();
}

// Зарегистрировать статический шаблон
async function addRoute(name: string, templateName: string): Promise<void> {
    const html = await loadTemplate(templateName);
    const routes = (window as unknown as { routes: Record<string, string> }).routes;
    routes[name] = html;
}

// Список динамических маршрутов
const dynamicRoutes: string[] = [
    'income-categories', 'expense-categories', 'income-edit', 'expense-edit',
    'income-expense', 'operation-create', 'operation-edit'
];

// Список защищённых маршрутов
const protectedRoutes: string[] = [
    'main', 'income-expense', 'income-categories', 'expense-categories',
    'income-create', 'income-edit', 'expense-create', 'expense-edit',
    'operation-create', 'operation-edit'
];

// Рендеринг страницы
async function renderPage(name: string, id: string | number | null = null): Promise<void> {
    const app = document.getElementById('app');
    if (!app) return;

    // Проверка авторизации
    if (protectedRoutes.includes(name) && !isLoggedIn()) {
        window.location.hash = 'login';
        return;
    }

    // Сайдбар
    const sidebar = document.getElementById('sidebar');
    if (name === 'login' || name === 'register') {
        if (sidebar) sidebar.style.display = 'none';
        app.classList.add('vh-100');
    } else {
        if (sidebar) sidebar.style.display = 'flex';
        app.classList.remove('vh-100');
    }

    // Главная
    if (name === 'main') {
        const template = await loadTemplate('main');
        app.innerHTML = template;
        try {
            const operations: Operation[] = await getOperations('all');
            const incomeOps = operations.filter(op => op.type === 'income');
            const expenseOps = operations.filter(op => op.type === 'expense');
            setTimeout(() => initMainCharts(incomeOps, expenseOps), 200);
        } catch (error) {
            console.error('Ошибка графиков:', error);
        }
        window.location.hash = 'main';
        return;
    }

    // Категории доходов
    if (name === 'income-categories') {
        try {
            const categories: Category[] = await getIncomeCategories();
            let template = await loadTemplate('income-categories');
            const cardsHtml = categories.map(cat => `
                <div class="col">
                    <div class="card" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                        <div class="card-body">
                            <h5 class="card-title fs-3" style="color: #052C65;">${cat.title}</h5>
                            <div class="d-flex gap-2 mt-3">
                                <button class="btn btn-primary px-3 me-2" onclick="renderPage('income-edit', ${cat.id})">Редактировать</button>
                                <button class="btn btn-danger px-3" data-bs-toggle="modal" data-bs-target="#deleteCategoryModal" data-category-id="${cat.id}" data-category-type="income">Удалить</button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            template = template.replace('{{cardsHtml}}', cardsHtml);
            app.innerHTML = template;
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = name;
        return;
    }

    // Категории расходов
    if (name === 'expense-categories') {
        try {
            const categories: Category[] = await getExpenseCategories();
            let template = await loadTemplate('expense-categories');
            const cardsHtml = categories.map(cat => `
                <div class="col">
                    <div class="card" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                        <div class="card-body">
                            <h5 class="card-title fs-3" style="color: #052C65;">${cat.title}</h5>
                            <div class="d-flex gap-2 mt-3">
                                <button class="btn btn-primary px-3 me-2" onclick="renderPage('expense-edit', ${cat.id})">Редактировать</button>
                                <button class="btn btn-danger px-3" data-bs-toggle="modal" data-bs-target="#deleteCategoryModal" data-category-id="${cat.id}" data-category-type="expense">Удалить</button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            template = template.replace('{{cardsHtml}}', cardsHtml);
            app.innerHTML = template;
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = name;
        return;
    }

    // Редактирование доходов
    if (name === 'income-edit' && id) {
        try {
            const category: Category = await request('/categories/income/' + id, 'GET') as Category;
            let template = await loadTemplate('income-edit');
            template = template.replace('{{title}}', category.title).replace('{{id}}', String(category.id));
            app.innerHTML = template;
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id}`;
        return;
    }

    // Редактирование расходов
    if (name === 'expense-edit' && id) {
        try {
            const category: Category = await request('/categories/expense/' + id, 'GET') as Category;
            let template = await loadTemplate('expense-edit');
            template = template.replace('{{title}}', category.title).replace('{{id}}', String(category.id));
            app.innerHTML = template;
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id}`;
        return;
    }

    // Доходы и расходы
    if (name === 'income-expense') {
        try {
            const period = (id as string) || 'all';
            const operations: Operation[] = await getOperations(period) as Operation[];
            let template = await loadTemplate('income-expense');
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
            template = template.replace('{{rowsHtml}}', rowsHtml || '<tr><td colspan="7" class="text-center">Нет операций</td></tr>');
            app.innerHTML = template;
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        return;
    }

    // Создание операции
    if (name === 'operation-create') {
        const operationType = id || 'income';
        try {
            const incomeCategories: Category[] = await getIncomeCategories();
            const expenseCategories: Category[] = await getExpenseCategories();
            const categories = operationType === 'income' ? incomeCategories : expenseCategories;
            let template = await loadTemplate('operation-create');
            template = template
                .replace('{{incomeSelected}}', operationType === 'income' ? 'selected' : '')
                .replace('{{expenseSelected}}', operationType === 'expense' ? 'selected' : '')
                .replace('{{categoryOptions}}', categories.map(c => `<option value="${c.id}">${c.title}</option>`).join(''));
            app.innerHTML = template;
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id || 'income'}`;
        return;
    }

    // Редактирование операции
    if (name === 'operation-edit' && id) {
        try {
            const operation: Operation = await request('/operations/' + id, 'GET') as Operation;
            const incomeCategories: Category[] = await getIncomeCategories();
            const expenseCategories: Category[] = await getExpenseCategories();
            const categories = operation.type === 'income' ? incomeCategories : expenseCategories;
            let template = await loadTemplate('operation-edit');
            template = template
                .replace('{{incomeSelected}}', operation.type === 'income' ? 'selected' : '')
                .replace('{{expenseSelected}}', operation.type === 'expense' ? 'selected' : '')
                .replace('{{categoryOptions}}', categories.map(c => `<option value="${c.id}" ${c.id === operation.category_id ? 'selected' : ''}>${c.title}</option>`).join(''))
                .replace('{{amount}}', String(operation.amount))
                .replace('{{date}}', operation.date)
                .replace('{{comment}}', operation.comment || '')
                .replace('{{id}}', String(operation.id));
            app.innerHTML = template;
        } catch (error) {
            app.innerHTML = '<h2>Ошибка загрузки данных</h2>';
        }
        window.location.hash = `${name}?id=${id}`;
        return;
    }

    // Статические страницы
    const routes = (window as unknown as { routes: Record<string, string> }).routes;
    if (routes[name]) {
        app.innerHTML = routes[name];
        window.location.hash = name;
        return;
    }

    app.innerHTML = '<h2>Страница не найдена</h2>';
}

// Загрузка всех статических шаблонов при старте
async function initRoutes(): Promise<void> {
    await addRoute('main', 'main');
    await addRoute('income-create', 'income-create');
    await addRoute('expense-create', 'expense-create');
}

// DOM готов
document.addEventListener('DOMContentLoaded', async function () {
    await initRoutes();

    const fullHash = window.location.hash.substring(1);
    const [hash, query] = fullHash.split('?');
    const params = new URLSearchParams(query || '');
    const id = params.get('id');

    const routes = (window as unknown as { routes: Record<string, string> }).routes;

    if (hash && (routes[hash] || dynamicRoutes.includes(hash))) {
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

// Hash change
window.addEventListener('hashchange', async function () {
    const fullHash = window.location.hash.substring(1);
    const [hash, query] = fullHash.split('?');
    const params = new URLSearchParams(query || '');
    const id = params.get('id');

    const routes = (window as unknown as { routes: Record<string, string> }).routes;

    if (hash && (routes[hash] || dynamicRoutes.includes(hash))) {
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

// Глобальные функции
(window as unknown as { renderPage: typeof renderPage }).renderPage = renderPage;

function editOperation(id: number): void {
    renderPage('operation-edit', id);
}
(window as unknown as { editOperation: (id: number) => void }).editOperation = editOperation;