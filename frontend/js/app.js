const API_URL = 'http://localhost:3000/api';

//==================== ПРОВЕРКА АВТОРИЗАЦИИ ====================\\
function isLoggedIn() {
    return !!localStorage.getItem('accessToken');
}

// если пользователь не авторизован и это не страница логина/регистрации --> редирект
if (!isLoggedIn()) {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== '') {
        window.location.href = 'login.html';
    }
}

//==================== ОШИБКИ ПОД ПОЛЕМ ====================\\

function showError(inputElement, message) {
    // удаляем старую ошибку, если была
    const oldFeedback = inputElement.parentElement.querySelector('.invalid-feedback');
    if (oldFeedback) oldFeedback.remove();

    // добавляем красную рамку
    inputElement.classList.add('is-invalid');

    // создаём текст ошибки
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;

    // вставляем после поля
    inputElement.after(feedback);
}

// очистить все ошибки
function clearErrors(formElement) {
    formElement.querySelectorAll('.is-invalid').forEach(input => {
        input.classList.remove('is-invalid');
    });
    formElement.querySelectorAll('.invalid-feedback').forEach(fb => {
        fb.remove();
    });
}

async function request(url, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };

    // если есть сохранённый токен, добавляем его в заголовок
    const token = localStorage.getItem('accessToken');
    if (token) {
        headers['x-auth-token'] = token;
    }

    const response = await fetch(API_URL + url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Ошибка запроса');
    }

    return data;
}

//==================== ФУНКЦИЯ ЛОГИНА ====================\\

async function login(email, password, rememberMe) {
    const data = await request('/login', 'POST', {
        email,
        password,
        rememberMe
    });

    // сохраняем токены в localStorage
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);

    // сохраняем данные пользователя
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
}

//==================== ОБРАБОТЧИК ФОРМЫ ЛОГИНА ====================\\

if (document.getElementById('loginForm')) {
    document.getElementById('loginBtn').addEventListener('click', async function() {
        const form = document.getElementById('loginForm');
        clearErrors(form);

        const emailInput = form.querySelector('input[type="email"]');
        const passwordInput = form.querySelector('input[type="password"]');
        const rememberMe = document.getElementById('rememberMe')?.checked || false;

        try {
            const result = await login(emailInput.value, passwordInput.value, rememberMe);
            console.log('Успешный вход:', result);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Ошибка входа:', error.message);

            const msg = error.message.toLowerCase();
            if (msg.includes('email') || msg.includes('почта')) {
                showError(emailInput, error.message);
            } else if (msg.includes('пароль') || msg.includes('password')) {
                showError(passwordInput, error.message);
            } else {
                // показываем на обоих полях, если непонятно
                showError(emailInput, error.message);
                showError(passwordInput, error.message);
            }
        }
    });
}

//==================== ФУНКЦИЯ РЕГИСТРАЦИИ ====================\\

async function signup(name, lastName, email, password, passwordRepeat) {
    await request('/signup', 'POST', {
        name,
        lastName,
        email,
        password,
        passwordRepeat
    });

    // после успешной регистрации сразу логинимся
    return await login(email, password, false);
}

//==================== ОБРАБОТЧИК ФОРМЫ РЕГИСТРАЦИИ ====================\\

if (document.getElementById('registerForm')) {
    document.getElementById('registerBtn').addEventListener('click', async function() {
        const form = document.getElementById('registerForm');
        clearErrors(form);

        const nameInput = form.querySelector('input[placeholder="Имя"]');
        const lastNameInput = form.querySelector('input[placeholder="Фамилия"]');
        const emailInput = form.querySelector('input[type="email"]');
        const passwordInputs = form.querySelectorAll('input[type="password"]');
        const passwordInput = passwordInputs[0];
        const passwordRepeatInput = passwordInputs[1];

        // базовая проверка перед отправкой
        if (passwordInput.value !== passwordRepeatInput.value) {
            showError(passwordRepeatInput, 'Пароли не совпадают');
            return;
        }

        try {
            const result = await signup(
                nameInput.value,
                lastNameInput.value,
                emailInput.value,
                passwordInput.value,
                passwordRepeatInput.value
            );
            console.log('Успешная регистрация:', result);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Ошибка регистрации:', error.message);

            const msg = error.message.toLowerCase();

            // Если ошибка содержит ключевые слова — показываем у конкретного поля
            if (msg.includes('почта') || msg.includes('email')) {
                showError(emailInput, error.message);
            } else if (msg.includes('парол') || msg.includes('password')) {
                showError(passwordInput, error.message);
            } else if (msg.includes('имя') || msg.includes('name')) {
                showError(nameInput, error.message);
            } else if (msg.includes('фамили') || msg.includes('lastname')) {
                showError(lastNameInput, error.message);
            } else {
                // Если непонятно — показываем под всеми полями или под email
                showError(emailInput, error.message);
                showError(passwordInput, error.message);
            }
        }
    });
}