//==================== ШАБЛОН ГЛАВНОЙ СТРАНИЦЫ ====================
addRoute('main', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Главная</h2>

    <div class="rowOfButtons d-flex align-items-center gap-3" style="margin: 60px 0 40px 0;" id="mainFilterButtons">
        <button class="btn-filter active" data-period="all">Все</button>
        <button class="btn-filter" data-period="today">Сегодня</button>
        <button class="btn-filter" data-period="week">Неделя</button>
        <button class="btn-filter" data-period="month">Месяц</button>
        <button class="btn-filter" data-period="year">Год</button>
        <button class="btn-filter" data-period="interval">Интервал</button>
        <span class="ms-3 fw-medium" style="font-size: 14px; color: black">
        с <input type="date" id="mainDateFrom" style="border: 1px solid #6C757D; border-radius: 4px; padding: 2px 5px; width: 130px;" disabled>
        по <input type="date" id="mainDateTo" style="border: 1px solid #6C757D; border-radius: 4px; padding: 2px 5px; width: 130px;" disabled>
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
function getIncomeCategoriesTemplate(categories) {
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

    return `
        <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Доходы</h2>
        <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-2 row-cols-xl-3 row-cols-xxl-3 g-3 mt-4" style="margin-bottom: 173px;">
            ${cardsHtml}
            <div class="col">
                <div class="card p-3 d-flex align-items-center justify-content-center" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                    <a href="javascript:void(0)" onclick="renderPage('income-create')" style="font-size: 36px; color: #D9D9D9; text-decoration: none;">+</a>
                </div>
            </div>
        </div>
    `;
}

//==================== ШАБЛОН КАТЕГОРИИ РАСХОДОВ ====================
function getExpenseCategoriesTemplate(categories) {
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

    return `
        <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Расходы</h2>
        <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-2 row-cols-xl-3 row-cols-xxl-3 g-3 mt-4" style="margin-bottom: 173px;">
            ${cardsHtml}
            <div class="col">
                <div class="card p-3 d-flex align-items-center justify-content-center" style="height: 121px; border: 1px solid #D9D9D9; border-radius: 12px;">
                    <a href="javascript:void(0)" onclick="renderPage('expense-create')" style="font-size: 36px; color: #D9D9D9; text-decoration: none;">+</a>
                </div>
            </div>
        </div>
    `;
}

//==================== ШАБЛОН ДОХОДЫ И РАСХОДЫ ====================\\
function getOperationsTemplate(operations) {
    const sortedOps = [...operations].sort((a, b) => a.id - b.id);
    const rowsHtml = operations.map(
        op => `
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
					<a href="javascript:void(0)" onclick="window.editOperation(${op.id})" class="me-3"
					   style="text-decoration: none;">✏️</a>
					<a href="#" data-bs-toggle="modal" data-bs-target="#deleteOperationModal"
					   data-operation-id="${op.id}" style="text-decoration: none;">🗑️</a>
				</td>
			</tr>
        `).join('');

    return `
        <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Доходы и расходы</h2>
        <div class="mt-5" style="max-width: 400px;">
            <div class="d-flex gap-3">
                <button class="btn btn-success px-3" onclick="renderPage('operation-create', 'income')">Создать доход</button>
                <button class="btn btn-danger px-3" onclick="renderPage('operation-create', 'expense')">Создать расход</button>
            </div>
        </div>
        <div class="rowOfButtons d-flex align-items-center gap-3 mt-4 mb-4" id="filterButtons">
            <button class="btn-filter active" data-period="all">Все</button>
            <button class="btn-filter" data-period="today">Сегодня</button>
            <button class="btn-filter" data-period="week">Неделя</button>
            <button class="btn-filter" data-period="month">Месяц</button>
            <button class="btn-filter" data-period="year">Год</button>
            <button class="btn-filter" data-period="interval">Интервал</button>
            <span class="ms-3 fw-medium" style="font-size: 14px; color: black">
            с <input type="date" id="filterDateFrom" style="border: 1px solid #6C757D; border-radius: 4px; padding: 2px 5px; width: 130px;" disabled>
            по <input type="date" id="filterDateTo" style="border: 1px solid #6C757D; border-radius: 4px; padding: 2px 5px; width: 130px;" disabled>
            </span>
        </div>
        <div class="table-responsive">
            <table class="table table-borderless" style="border-collapse: collapse; font-size: 16px">
                <thead>
                    <tr style="border-bottom: 1px solid #D9D9D9; border-top: 1px solid #D9D9D9; color: #052c65;">
                        <th>№ операции</th><th>Тип</th><th>Категория</th><th>Сумма</th><th>Дата</th><th>Комментарий</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="7" class="text-center">Нет операций</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

//==================== ШАБЛОН СОЗДАНИЯ КАТЕГОРИИ ДОХОДОВ ====================
addRoute('income-create', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Создание категории доходов</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" id="incomeCategoryTitle" class="form-control mb-3" placeholder="Название...">
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3" id="createIncomeCategoryBtn">Создать</button>
            <button class="btn btn-danger px-3" onclick="renderPage('income-categories')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН РЕДАКТИРОВАНИЯ КАТЕГОРИИ ДОХОДОВ ====================
function getIncomeEditTemplate(category) {
    return `
        <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Редактирование категории доходов</h2>
        <div class="mt-5" style="max-width: 400px;">
            <input type="text" id="editIncomeCategoryTitle" class="form-control mb-3" value="${category.title}">
            <div class="d-flex gap-3">
                <button class="btn btn-success px-3" id="updateIncomeCategoryBtn" data-id="${category.id}">Сохранить</button>
                <button class="btn btn-danger px-3" onclick="renderPage('income-categories')">Отмена</button>
            </div>
        </div>
    `;
}

//==================== ШАБЛОН СОЗДАНИЯ КАТЕГОРИИ РАСХОДОВ ====================
addRoute('expense-create', `
    <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Создание категории расходов</h2>
    <div class="mt-5" style="max-width: 400px;">
        <input type="text" id="expenseCategoryTitle" class="form-control mb-3" placeholder="Название...">
        <div class="d-flex gap-3">
            <button class="btn btn-success px-3" id="createExpenseCategoryBtn">Создать</button>
            <button class="btn btn-danger px-3" onclick="renderPage('expense-categories')">Отмена</button>
        </div>
    </div>
`);

//==================== ШАБЛОН РЕДАКТИРОВАНИЯ КАТЕГОРИИ РАСХОДОВ ====================
function getExpenseEditTemplate(category) {
    return `
        <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Редактирование категории расходов</h2>
        <div class="mt-5" style="max-width: 400px;">
            <input type="text" id="editExpenseCategoryTitle" class="form-control mb-3" value="${category.title}">
            <div class="d-flex gap-3">
                <button class="btn btn-success px-3" id="updateExpenseCategoryBtn" data-id="${category.id}">Сохранить</button>
                <button class="btn btn-danger px-3" onclick="renderPage('expense-categories')">Отмена</button>
            </div>
        </div>
    `;
}

//==================== ШАБЛОН СОЗДАНИЯ ДОХОДА/РАСХОДА ====================
function getOperationCreateTemplate(incomeCategories, expenseCategories, defaultType = 'income') {
    const incomeSelected = defaultType === 'income' ? 'selected' : '';
    const expenseSelected = defaultType === 'expense' ? 'selected' : '';
    const categories = defaultType === 'income' ? incomeCategories : expenseCategories;

    return `
        <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Создание дохода/расхода</h2>
        <div class="mt-5" style="max-width: 400px;">
            <select id="operationType" class="form-select mb-2">
                <option value="income" ${incomeSelected}>Доход</option>
                <option value="expense" ${expenseSelected}>Расход</option>
            </select>
            <select id="operationCategory" class="form-select mb-2">
                ${categories.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
            </select>
            <input type="number" id="operationAmount" class="form-control mb-2" placeholder="Сумма в $...">
            <input type="date" id="operationDate" class="form-control mb-2">
            <textarea id="operationComment" class="form-control mb-3" placeholder="Комментарий..." rows="3"></textarea>
            <div class="d-flex gap-3">
                <button class="btn btn-success px-3" id="createOperationBtn">Создать</button>
                <button class="btn btn-danger px-3" onclick="renderPage('income-expense')">Отмена</button>
            </div>
        </div>
    `;
}

//==================== ШАБЛОН РЕДАКТИРОВАНИЯ ДОХОДА/РАСХОДА ====================
function getOperationEditTemplate(operation, incomeCategories, expenseCategories) {
    const incomeSelected = operation.type === 'income' ? 'selected' : '';
    const expenseSelected = operation.type === 'expense' ? 'selected' : '';
    const categories = operation.type === 'income' ? incomeCategories : expenseCategories;

    return `
        <h2 style="margin-top: 100px; font-size: 40px; color: #052C65">Редактирование дохода/расхода</h2>
        <div class="mt-5" style="max-width: 400px;">
            <select id="editOperationType" class="form-select mb-2" disabled>
                <option value="income" ${incomeSelected}>Доход</option>
                <option value="expense" ${expenseSelected}>Расход</option>
            </select>
            <select id="editOperationCategory" class="form-select mb-2">
                ${categories.map(c => `<option value="${c.id}" ${c.id === operation.category_id ? 'selected' : ''}>${c.title}</option>`).join('')}
            </select>
            <input type="number" id="editOperationAmount" class="form-control mb-2" value="${operation.amount}">
            <input type="date" id="editOperationDate" class="form-control mb-2" value="${operation.date}">
            <textarea id="editOperationComment" class="form-control mb-3" rows="3">${operation.comment || ''}</textarea>
            <div class="d-flex gap-3">
                <button class="btn btn-success px-3" id="updateOperationBtn" data-id="${operation.id}">Сохранить</button>
                <button class="btn btn-danger px-3" onclick="renderPage('income-expense')">Отмена</button>
            </div>
        </div>
    `;
}
