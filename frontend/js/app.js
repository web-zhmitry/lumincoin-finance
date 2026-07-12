const API_URL = 'http://localhost:3000/api';

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
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('accessToken');
    if (token) headers['x-auth-token'] = token;
    const response = await fetch(API_URL + url, { method, headers, body: body ? JSON.stringify(body) : null });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
    return data;
}

async function login(email, password, rememberMe) {
    const data = await request('/login', 'POST', { email, password, rememberMe });
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
}

async function signup(name, lastName, email, password, passwordRepeat) {
    await request('/signup', 'POST', { name, lastName, email, password, passwordRepeat });
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
document.addEventListener('click', async function(e) {
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

    // Кнопка регистрации
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

    // Ссылка "Пройдите регистрацию"
    if (e.target && e.target.getAttribute('href') === '#register') {
        e.preventDefault();
        renderPage('register');
    }

    // Ссылка "Войдите в систему"
    if (e.target && e.target.getAttribute('href') === '#login') {
        e.preventDefault();
        renderPage('login');
    }
});

// ==================== МЕНЮ ПОЛЬЗОВАТЕЛЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    const userMenuLink = document.getElementById('userMenuLink');
    const userMenu = document.getElementById('userMenu');
    if (userMenu) userMenu.style.display = 'none';

    if (userMenuLink) {
        userMenuLink.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (userMenu) {
                userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (userMenu && !e.target.closest('#userMenuLink') && !e.target.closest('#userMenu')) {
            userMenu.style.display = 'none';
        }
    });

    // Кнопка "Выйти"
    const logoutLink = document.querySelector('#userMenu a');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});