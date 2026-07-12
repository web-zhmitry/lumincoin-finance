console.log('ROUTER.JS РАБОТАЕТ #%$#ть!');

// хранилище шаблонов
window.routes = {};

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
function renderPage(name) {
    const app = document.getElementById('app');
    if (!app) return;

    // если страница защищённая, а пользователь не авторизован — редирект на логин
    if (protectedRoutes.includes(name) && !isLoggedIn()) {
        window.location.hash = 'login';
        return;
    }

    if (!window.routes[name]) {
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

    app.innerHTML = window.routes[name];
    window.location.hash = name;

    // если страница main — запускаем графики
    if (name === 'main') {
        setTimeout(function() {
            const oldIncome = Chart.getChart('incomeChart');
            const oldExpense = Chart.getChart('expenseChart');
            if (oldIncome) oldIncome.destroy();
            if (oldExpense) oldExpense.destroy();

            const incomeCtx = document.getElementById('incomeChart')?.getContext('2d');
            const expenseCtx = document.getElementById('expenseChart')?.getContext('2d');

            if (incomeCtx) {
                new Chart(incomeCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
                        datasets: [{ data: [100, 150, 50, 30, 40], backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0d6efd'] }]
                    }
                });
            }
            if (expenseCtx) {
                new Chart(expenseCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
                        datasets: [{ data: [300, 150, 50, 30, 40], backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0d6efd'] }]
                    }
                });
            }
        }, 100);
    }
}

// при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash.substring(1);
    if (hash && window.routes[hash]) {
        if (protectedRoutes.includes(hash) && !isLoggedIn()) {
            renderPage('login');
        } else {
            renderPage(hash);
        }
    } else {
        if (isLoggedIn()) {
            renderPage('main');
        } else {
            window.location.href = 'login.html'
        }
    }
});