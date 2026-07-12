//==================== ШАБЛОН ГЛАВНОЙ СТРАНИЦЫ ====================
addRoute('main', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Главная</h2>

    <div class="rowOfButtons d-flex align-items-center gap-3" style="margin: 60px 0 140px 0;">
        <button class="btn-filter">Сегодня</button>
        <button class="btn-filter">Неделя</button>
        <button class="btn-filter">Месяц</button>
        <button class="btn-filter">Год</button>
        <button class="btn-filter">Все</button>
        <button class="btn-filter">Интервал</button>

        <span class="ms-3 fw-medium" style="font-size: 14px; color: black">
            с
            <a href="#" style="color: #6C757D;text-decoration: none; border-bottom: 1px solid #6C757D" class="ms-1 me-2">Дата</a>
            по
            <a href="#" style="color: #6C757D;text-decoration: none; border-bottom: 1px solid #6C757D" class="ms-1">Дата</a>
        </span>
    </div>

    <div class="row position-relative" style="margin-bottom: 173px;">
        <div class="col-6 text-center">
            <h3 style="color: #052C65;">Доходы</h3>
            <canvas id="incomeChart" style="max-height: 360px;"></canvas>
        </div>

        <div style="position: absolute; top: 50px; bottom: 0; padding: 0; left: 50%; width: 1px; height: 400px; background-color: #D9D9D9; transform: translateX(-50%);"></div>

        <div class="col-6 text-center">
            <h3 class="fw-medium" style="color: #052C65; font-size: 28px">Расходы</h3>
            <canvas id="expenseChart" style="max-height: 360px;"></canvas>
        </div>
    </div>
`);

//==================== ШАБЛОН КАТЕГОРИИ ДОХОДОВ ====================
addRoute('income-categories', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Доходы</h2>
    <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-2 row-cols-xl-3 row-cols-xxl-3 g-3 mt-4" style="margin-bottom: 173px;">
        ${['Депозиты', 'Зарплата', 'Сбережения', 'Инвестиции'].map(name => `
            <div class="col">
                <div class="card" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                    <div class="card-body">
                        <h5 class="card-title fs-3" style="color: #052C65;">${name}</h5>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-primary px-3 me-2" onclick="renderPage('income-edit')">Редактировать</button>
                            <button class="btn btn-danger px-3" data-bs-toggle="modal" data-bs-target="#deleteCategoryModal">Удалить</button>
                        </div>
                    </div>
                </div>
            </div> 
        `).join('')}
        <div class="col">
            <div class="card p-3 d-flex align-items-center justify-content-center" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                <a href="#" onclick="renderPage('income-create')" style="font-size: 36px; color: #D9D9D9; text-decoration: none;">+</a>            
            </div>
        </div>
    </div>
`);

//==================== ШАБЛОН КАТЕГОРИИ РАСХОДОВ ====================
addRoute('expense-categories', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Расходы</h2>
    <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-2 row-cols-xl-3 row-cols-xxl-3 g-3 mt-4" style="margin-bottom: 173px;">
        ${['Еда', 'Жильё', 'Здоровье', 'Кафе', 'Авто', 'Одежда', 'Развлечения', 'Счета', 'Спорт'].map(name => `
            <div class="col">
                <div class="card" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                    <div class="card-body">
                        <h5 class="card-title fs-3" style="color: #052C65;">${name}</h5>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn btn-primary px-3 me-2" onclick="renderPage('expense-edit')">Редактировать</button>
                            <button class="btn btn-danger px-3" data-bs-toggle="modal" data-bs-target="#deleteCategoryModal">Удалить</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
        <div class="col">
            <div class="card p-3 d-flex align-items-center justify-content-center" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                <a href="#" onclick="renderPage('expense-create')" style="font-size: 36px; color: #D9D9D9; text-decoration: none;">+</a>
            </div>
        </div>
    </div>
`);

//==================== ШАБЛОН ДОХОДЫ И РАСХОДЫ ====================\\
addRoute('income-expense', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Доходы и расходы</h2>
    <div class="mt-5" style="max-width: 400px;">
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3" onclick="renderPage('operation-create')">Создать доход</button>
            <button class="btn btn-danger px-3" onclick="renderPage('operation-create')">Создать расход</button>
        </div>
    </div>
    <div class="rowOfButtons d-flex align-items-center gap-3 mt-4 mb-4">
        <button class="btn-filter">Сегодня</button>
        <button class="btn-filter">Неделя</button>
        <button class="btn-filter">Месяц</button>
        <button class="btn-filter">Год</button>
        <button class="btn-filter">Все</button>
        <button class="btn-filter">Интервал</button>
    </div>
    <div class="table-responsive">
        <table class="table table-borderless" style="border-collapse: collapse; font-size: 16px">
            <thead>
                <tr style="border-bottom: 1px solid #D9D9D9; border-top: 1px solid #D9D9D9; color: #052c65;">
                    <th>№ операции</th><th>Тип</th><th>Категория</th><th>Сумма</th><th>Дата</th><th>Комментарий</th><th></th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #D9D9D9;">
                    <td class="fw-medium">1</td>
                    <td style="color: #198754;">доход</td>
                    <td>зарплата</td>
                    <td>10000000$</td>
                    <td>11.09.2022</td>
                    <td></td>
                    <td class="text-end">
                        <a href="#" style="text-decoration: none" onclick="renderPage('operation-edit')" class="me-3">✏️</a>
                        <a href="#" style="text-decoration: none" data-bs-toggle="modal" data-bs-target="#deleteOperationModal" class="me-3">🗑️</a>
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #D9D9D9;">
                    <td class="fw-medium">2</td>
                    <td style="color: #dc3545;">расход</td>
                    <td>жильё</td>
                    <td>2500$</td>
                    <td>12.09.2022</td>
                    <td></td>
                    <td class="text-end">
                        <a href="#" style="text-decoration: none" onclick="renderPage('operation-edit')" class="me-3">✏️</a>
                        <a href="#" style="text-decoration: none" data-bs-toggle="modal" data-bs-target="#deleteOperationModal" class="me-3">🗑️</a>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
`);

//==================== ШАБЛОН СОЗДАНИЯ КАТЕГОРИИ ДОХОДОВ ====================
addRoute('income-create', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Создание категории доходов</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" class="form-control mb-3" placeholder="Название...">
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3">Создать</button>
            <button class="btn btn-danger px-3" onclick="renderPage('income-categories')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН РЕДАКТИРОВАНИЯ КАТЕГОРИИ ДОХОДОВ ====================
addRoute('income-edit', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Редактирование категории доходов</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" class="form-control mb-3" value="Название категории">
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3">Сохранить</button>
            <button class="btn btn-danger px-3" onclick="renderPage('income-categories')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН СОЗДАНИЯ КАТЕГОРИИ РАСХОДОВ ====================
addRoute('expense-create', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Создание категории расходов</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" class="form-control mb-3" placeholder="Название...">
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3">Создать</button>
            <button class="btn btn-danger px-3" onclick="renderPage('expense-categories')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН РЕДАКТИРОВАНИЯ КАТЕГОРИИ РАСХОДОВ ====================
addRoute('expense-edit', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Редактирование категории расходов</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" class="form-control mb-3" value="Название категории">
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3">Сохранить</button>
            <button class="btn btn-danger px-3" onclick="renderPage('expense-categories')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН СОЗДАНИЯ ДОХОДА/РАСХОДА ====================
addRoute('operation-create', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Создание дохода/расхода</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" class="form-control mb-2" placeholder="Тип...">
        <input type="text" class="form-control mb-2" placeholder="Категория...">
        <input type="number" class="form-control mb-2" placeholder="Сумма в $...">
        <input type="date" class="form-control mb-2">
        <textarea class="form-control mb-3" placeholder="Комментарий..." rows="3"></textarea>
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3">Создать</button>
            <button class="btn btn-danger px-3" onclick="renderPage('income-expense')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН РЕДАКТИРОВАНИЯ ДОХОДА/РАСХОДА ====================
addRoute('operation-edit', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Редактирование дохода/расхода</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" class="form-control mb-2" value="Доход" disabled>
        <input type="text" class="form-control mb-2" value="Зарплата">
        <input type="number" class="form-control mb-2" value="500">
        <input type="date" class="form-control mb-2" value="2022-09-11">
        <textarea class="form-control mb-3" rows="3"></textarea>
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3">Сохранить</button>
            <button class="btn btn-danger px-3" onclick="renderPage('income-expense')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН ====================
//==================== ШАБЛОН ====================
