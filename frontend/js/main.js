// --- BEGIN STATIC WEBSITE CODE ---
// 1. Utility functions and classes
const utils = {
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString();
    },
    formatCurrency(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    },
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

class NotificationService {
    static showSuccess(message) {
        alert(message); // Replace with custom UI if desired
    }
    static showError(message) {
        alert('Error: ' + message);
    }
}

class FinanceApp {
    constructor() {
        this.state = {
            transactions: Storage.getTransactions(),
            budgets: Storage.getBudgets(),
            bills: Storage.getBills(),
            goals: Storage.getGoals()
        };
    }

    addTransaction(tx) {
        tx.id = utils.generateId();
        this.state.transactions.push(tx);
        Storage.saveTransactions(this.state.transactions);
        NotificationService.showSuccess('Transaction added!');
    }

    updateTransaction(id, data) {
        const idx = this.state.transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
            this.state.transactions[idx] = { ...this.state.transactions[idx], ...data };
            Storage.saveTransactions(this.state.transactions);
            NotificationService.showSuccess('Transaction updated!');
        }
    }

    deleteTransaction(id) {
        this.state.transactions = this.state.transactions.filter(t => t.id !== id);
        Storage.saveTransactions(this.state.transactions);
        NotificationService.showSuccess('Transaction deleted!');
    }

    getTransactions() {
        return this.state.transactions;
    }

    // Similar methods for budgets, bills, goals can be added here
}

class DashboardPage {
    constructor() {
        this.render();
    }
    render() {
        // Example: render transaction count
        const txCount = window.app.getTransactions().length;
        const el = document.getElementById('dashboard-tx-count');
        if (el) el.textContent = txCount;
    }
}

class TransactionManager {
    constructor() {
        this.transactions = window.app.getTransactions();
    }
    add(tx) {
        window.app.addTransaction(tx);
        this.transactions = window.app.getTransactions();
    }
    update(id, data) {
        window.app.updateTransaction(id, data);
        this.transactions = window.app.getTransactions();
    }
    delete(id) {
        window.app.deleteTransaction(id);
        this.transactions = window.app.getTransactions();
    }
    getAll() {
        return this.transactions;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
    window.dashboardPage = new DashboardPage();
    window.transactionManager = new TransactionManager();
    window.utils = utils;
    window.CONFIG = {};
    // Hide loading overlay if present
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    // Show main app container
    const appContainer = document.getElementById('app');
    if (appContainer) appContainer.style.display = 'flex';

    // --- BUTTON & NAVIGATION HANDLERS ---
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const page = item.getAttribute('data-page');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const pageDiv = document.getElementById(page + '-page');
            if (pageDiv) pageDiv.classList.add('active');
        });
    });

    // Add Transaction button
    document.getElementById('add-transaction-btn')?.addEventListener('click', () => {
        document.getElementById('transaction-modal').style.display = 'flex';
    });
    // Quick Add Income/Expense
    document.getElementById('quick-add-income')?.addEventListener('click', () => {
        document.getElementById('transaction-modal').style.display = 'flex';
        document.getElementById('transaction-type').value = 'income';
    });
    document.getElementById('quick-add-expense')?.addEventListener('click', () => {
        document.getElementById('transaction-modal').style.display = 'flex';
        document.getElementById('transaction-type').value = 'expense';
    });
    // Quick Add Bill/Goal (future: show relevant modals)
    document.getElementById('quick-add-bill')?.addEventListener('click', () => {
        alert('Bill modal not implemented yet.');
    });
    document.getElementById('quick-add-goal')?.addEventListener('click', () => {
        alert('Goal modal not implemented yet.');
    });
    // Modal close/cancel
    document.getElementById('cancel-transaction')?.addEventListener('click', () => {
        document.getElementById('transaction-modal').style.display = 'none';
    });
    // Clicking outside modal closes it
    document.getElementById('transaction-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('transaction-modal')) {
            document.getElementById('transaction-modal').style.display = 'none';
        }
    });
    // View All (Recent Transactions)
    document.querySelector('.view-all[data-page="transactions"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.menu-item[data-page="transactions"]').classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('transactions-page').classList.add('active');
    });
});
// --- END STATIC WEBSITE CODE ---

// --- BEGIN ENHANCEMENTS FOR FULL FUNCTIONALITY ---

const DEFAULT_CATEGORIES = [
    'Salary', 'Business', 'Investment', 'Gift', 'Food', 'Transport', 'Shopping', 'Utilities', 'Health', 'Entertainment', 'Other'
];

function populateCategoryDropdown() {
    const select = document.getElementById('transaction-category');
    if (!select) return;
    select.innerHTML = '<option value="">Select category</option>' +
        DEFAULT_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function renderRecentTransactions() {
    const txs = window.app.getTransactions().slice(-5).reverse();
    const container = document.getElementById('recent-transactions');
    if (!container) return;
    if (txs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No recent transactions.</p></div>';
        return;
    }
    container.innerHTML = txs.map(tx => `
        <div class="transaction-item">
            <div class="transaction-icon ${tx.type}"><i class="fas fa-${tx.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i></div>
            <div class="transaction-details">
                <div class="transaction-description">${tx.description}</div>
                <div class="transaction-category">${tx.category}</div>
            </div>
            <div class="transaction-meta">
                <div class="transaction-date">${utils.formatDate(tx.date)}</div>
                <div class="transaction-amount ${tx.type}">${utils.formatCurrency(tx.amount)}</div>
            </div>
        </div>
    `).join('');
}

function updateDashboardSummary() {
    const txs = window.app.getTransactions();
    let income = 0, expenses = 0;
    txs.forEach(tx => {
        if (tx.type === 'income') income += parseFloat(tx.amount);
        else if (tx.type === 'expense') expenses += parseFloat(tx.amount);
    });
    const balance = income - expenses;
    document.getElementById('total-balance').textContent = utils.formatCurrency(balance);
    document.getElementById('monthly-income').textContent = utils.formatCurrency(income);
    document.getElementById('monthly-expenses').textContent = utils.formatCurrency(expenses);
    // Simple change indicators (could be improved)
    document.getElementById('balance-change').textContent = (balance >= 0 ? '+' : '-') + utils.formatCurrency(Math.abs(balance));
    document.getElementById('income-change').textContent = '+0%';
    document.getElementById('expenses-change').textContent = '+0%';
    document.getElementById('upcoming-bills').textContent = window.app.state.bills.length;
    document.getElementById('bills-amount').textContent = utils.formatCurrency(window.app.state.bills.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0));
}

function handleTransactionForm() {
    const form = document.getElementById('transaction-form');
    if (!form) return;
    form.onsubmit = function(e) {
        e.preventDefault();
        const type = form['type'].value;
        const amount = form['amount'].value;
        const description = form['description'].value;
        const category = form['category'].value;
        const date = form['date'].value;
        if (!type || !amount || !description || !category || !date) return;
        window.transactionManager.add({ type, amount, description, category, date });
        document.getElementById('transaction-modal').style.display = 'none';
        form.reset();
        updateDashboardSummary();
        renderRecentTransactions();
    };
}

function renderCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;
    const txs = window.app.getTransactions().filter(tx => tx.type === 'expense');
    const data = {};
    txs.forEach(tx => {
        data[tx.category] = (data[tx.category] || 0) + parseFloat(tx.amount);
    });
    const categories = Object.keys(data);
    const amounts = Object.values(data);
    if (window.categoryChart) window.categoryChart.destroy();
    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#64748b', '#a78bfa', '#f472b6', '#facc15', '#34d399', '#60a5fa'
                ],
            }]
        },
        options: {
            plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function renderIncomeExpenseChart() {
    const ctx = document.getElementById('income-expense-chart');
    if (!ctx) return;
    const txs = window.app.getTransactions();
    let income = 0, expenses = 0;
    txs.forEach(tx => {
        if (tx.type === 'income') income += parseFloat(tx.amount);
        else if (tx.type === 'expense') expenses += parseFloat(tx.amount);
    });
    if (window.incomeExpenseChart) window.incomeExpenseChart.destroy();
    window.incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount',
                data: [income, expenses],
                backgroundColor: [ '#10b981', '#ef4444' ]
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } },
                y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    populateCategoryDropdown();
    renderRecentTransactions();
    updateDashboardSummary();
    handleTransactionForm();
    renderCategoryChart();
    renderIncomeExpenseChart();
    // Optionally, re-render charts when transactions change
});
// --- END ENHANCEMENTS ---

// --- BEGIN SUBTAB RENDERING ---

function renderTransactionsPage() {
    const page = document.getElementById('transactions-page');
    if (!page) return;
    const txs = window.app.getTransactions();
    if (txs.length === 0) {
        page.innerHTML = '<div class="empty-state"><p>No transactions found.</p></div>';
        return;
    }
    page.innerHTML = `
        <h2>All Transactions</h2>
        <div class="transaction-list">
            ${txs.map(tx => `
                <div class="transaction-item">
                    <div class="transaction-icon ${tx.type}"><i class="fas fa-${tx.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i></div>
                    <div class="transaction-details">
                        <div class="transaction-description">${tx.description}</div>
                        <div class="transaction-category">${tx.category}</div>
                    </div>
                    <div class="transaction-meta">
                        <div class="transaction-date">${utils.formatDate(tx.date)}</div>
                        <div class="transaction-amount ${tx.type}">${utils.formatCurrency(tx.amount)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderBudgetsPage() {
    const page = document.getElementById('budgets-page');
    if (!page) return;
    const budgets = window.app.state.budgets || [];
    const txs = window.app.getTransactions();
    page.innerHTML = `
        <h2 class="budgets-title">Budgets</h2>
        <form id="budget-form" class="budget-form">
            <div class="budget-form-group">
                <label for="budget-category">Category</label>
                <select id="budget-category" required>
                    <option value="">Select category</option>
                    ${DEFAULT_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            <div class="budget-form-group">
                <label for="budget-amount">Amount</label>
                <input type="number" id="budget-amount" min="0.01" step="0.01" required />
            </div>
            <div class="budget-form-group">
                <label for="budget-period">Period</label>
                <select id="budget-period" required>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary budget-add-btn">Add Budget</button>
        </form>
        <div id="budgets-list"></div>
    `;
    renderBudgetsList();
    document.getElementById('budget-form').onsubmit = function(e) {
        e.preventDefault();
        const category = document.getElementById('budget-category').value;
        const amount = parseFloat(document.getElementById('budget-amount').value);
        const period = document.getElementById('budget-period').value;
        if (!category || !amount || !period) return;
        window.app.state.budgets.push({ id: utils.generateId(), category, amount, period });
        Storage.saveBudgets(window.app.state.budgets);
        renderBudgetsList();
        this.reset();
    };
}

function renderBudgetsList() {
    const list = document.getElementById('budgets-list');
    if (!list) return;
    // Remove duplicate budgets (same category and period)
    const budgetsRaw = window.app.state.budgets || [];
    const uniqueBudgets = [];
    const seen = new Set();
    for (const b of budgetsRaw) {
        const key = b.category + '|' + b.period;
        if (!seen.has(key)) {
            uniqueBudgets.push(b);
            seen.add(key);
        }
    }
    // If duplicates were found and removed, update storage
    if (uniqueBudgets.length !== budgetsRaw.length) {
        window.app.state.budgets = uniqueBudgets;
        Storage.saveBudgets(uniqueBudgets);
    }
    const txs = window.app.getTransactions();
    if (uniqueBudgets.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No budgets set. Add one above!</p></div>';
        return;
    }
    list.innerHTML = `
    <div style="display:flex;justify-content:center;">
      <table class="budget-table w-full" style="margin:2rem auto;min-width:700px;box-shadow:0 2px 12px #0001;border-radius:12px;overflow:hidden;background:var(--bg-primary);">
        <thead style="background:var(--bg-tertiary);">
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Period</th>
            <th>Spent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        ${uniqueBudgets.map(b => {
            const spent = txs.filter(tx => tx.category === b.category && tx.type === 'expense')
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            const percent = Math.round((spent/b.amount)*100)||0;
            const periodLabel = b.period.charAt(0).toUpperCase() + b.period.slice(1);
            return `<tr style="text-align:center;">
                <td>${b.category}</td>
                <td>${utils.formatCurrency(b.amount)}</td>
                <td>${periodLabel}</td>
                <td>
                  <div style="display:flex;flex-direction:column;align-items:center;">
                    <span>${utils.formatCurrency(spent)} <span style="color:${percent>100?'var(--danger-color)':'var(--primary-color)'};font-weight:bold;">(${percent}%)</span></span>
                    <div class="progress-bar" style="width:100px;height:8px;background:#e2e8f0;border-radius:4px;margin-top:6px;">
                      <div class="progress-bar-inner" style="height:8px;border-radius:4px;background:${percent>100?'var(--danger-color)':'var(--primary-color)'};width:${Math.min(percent,120)}%;transition:width .3s;"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" style="padding:0.5rem 1.2rem;font-size:1rem;border-radius:8px;margin-bottom:0.5rem;" onclick="editBudget('${b.id}')">Edit</button><br>
                  <button class="btn btn-danger btn-sm" style="padding:0.5rem 1.2rem;font-size:1rem;border-radius:8px;" onclick="deleteBudget('${b.id}')">Delete</button>
                </td>
            </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>`;
}

window.editBudget = function(id) {
    const budget = (window.app.state.budgets || []).find(b => b.id === id);
    if (!budget) return;
    // Fill the form with the budget's data
    document.getElementById('budget-category').value = budget.category;
    document.getElementById('budget-amount').value = budget.amount;
    document.getElementById('budget-period').value = budget.period;
    // Set edit mode
    window.budgetEditId = id;
    // Change button text to 'Update Budget'
    const addBtn = document.querySelector('.budget-add-btn');
    if (addBtn) addBtn.textContent = 'Update Budget';
};

// Patch the form submit to handle edit mode
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    // Patch budget form submit for edit
    const form = document.getElementById('budget-form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            const category = form['budget-category'].value;
            const amount = parseFloat(form['budget-amount'].value);
            const period = form['budget-period'].value;
            if (!category || !amount || !period) return;
            if (window.budgetEditId) {
                // Update existing budget
                window.app.state.budgets.push({ id: window.budgetEditId, category, amount, period });
                window.budgetEditId = null;
                const addBtn = document.querySelector('.budget-add-btn');
                if (addBtn) addBtn.textContent = 'Add Budget';
            } else {
                // Add new budget
                window.app.state.budgets.push({ id: utils.generateId(), category, amount, period });
            }
            Storage.saveBudgets(window.app.state.budgets);
            renderBudgetsList();
            form.reset();
        };
    }
});

function renderBillsPage() {
    const page = document.getElementById('bills-page');
    if (!page) return;
    page.innerHTML = '<h2>Bills</h2><div class="empty-state"><p>Bill reminders coming soon!</p></div>';
}

function renderGoalsPage() {
    const page = document.getElementById('goals-page');
    if (!page) return;
    page.innerHTML = '<h2>Goals</h2><div class="empty-state"><p>Goal setting coming soon!</p></div>';
}

function renderReportsPage() {
    const page = document.getElementById('reports-page');
    if (!page) return;
    page.innerHTML = '<h2>Reports</h2><div class="empty-state"><p>Reports and analytics coming soon!</p></div>';
}

function handleTabRendering() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page === 'dashboard') {
                updateDashboardSummary();
                renderRecentTransactions();
            } else if (page === 'transactions') {
                renderTransactionsPage();
            } else if (page === 'budgets') {
                renderBudgetsPage();
            } else if (page === 'bills') {
                renderBillsPage();
            } else if (page === 'goals') {
                renderGoalsPage();
            } else if (page === 'reports') {
                renderReportsPage();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Robust Theme toggle
    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.removeAttribute('data-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class=\"fas fa-moon\"></i>';
        }
    }
    const themeToggle = document.getElementById('theme-toggle');
    // Set theme on load
    setTheme(localStorage.getItem('theme'));
    if (themeToggle) {
        themeToggle.onclick = function() {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        };
    }
    handleTabRendering();
    // Render default dashboard and transactions page content
    renderTransactionsPage();
    renderBudgetsPage();
    renderBillsPage();
    renderGoalsPage();
    renderReportsPage();
});
// --- END SUBTAB RENDERING ---

// --- BEGIN BUDGET FUNCTIONALITY ---

function renderBudgetsPage() {
    const page = document.getElementById('budgets-page');
    if (!page) return;
    const budgets = window.app.state.budgets || [];
    const txs = window.app.getTransactions();
    page.innerHTML = `
        <h2 class="budgets-title">Budgets</h2>
        <form id="budget-form" class="budget-form">
            <div class="budget-form-group">
                <label for="budget-category">Category</label>
                <select id="budget-category" required>
                    <option value="">Select category</option>
                    ${DEFAULT_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            <div class="budget-form-group">
                <label for="budget-amount">Amount</label>
                <input type="number" id="budget-amount" min="0.01" step="0.01" required />
            </div>
            <div class="budget-form-group">
                <label for="budget-period">Period</label>
                <select id="budget-period" required>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary budget-add-btn">Add Budget</button>
        </form>
        <div id="budgets-list"></div>
    `;
    renderBudgetsList();
    document.getElementById('budget-form').onsubmit = function(e) {
        e.preventDefault();
        const category = document.getElementById('budget-category').value;
        const amount = parseFloat(document.getElementById('budget-amount').value);
        const period = document.getElementById('budget-period').value;
        if (!category || !amount || !period) return;
        window.app.state.budgets.push({ id: utils.generateId(), category, amount, period });
        Storage.saveBudgets(window.app.state.budgets);
        renderBudgetsList();
        this.reset();
    };
}

function renderBudgetsList() {
    const list = document.getElementById('budgets-list');
    if (!list) return;
    // Remove duplicate budgets (same category and period)
    const budgetsRaw = window.app.state.budgets || [];
    const uniqueBudgets = [];
    const seen = new Set();
    for (const b of budgetsRaw) {
        const key = b.category + '|' + b.period;
        if (!seen.has(key)) {
            uniqueBudgets.push(b);
            seen.add(key);
        }
    }
    // If duplicates were found and removed, update storage
    if (uniqueBudgets.length !== budgetsRaw.length) {
        window.app.state.budgets = uniqueBudgets;
        Storage.saveBudgets(uniqueBudgets);
    }
    const txs = window.app.getTransactions();
    if (uniqueBudgets.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No budgets set. Add one above!</p></div>';
        return;
    }
    list.innerHTML = `
    <div style="display:flex;justify-content:center;">
      <table class="budget-table w-full" style="margin:2rem auto;min-width:700px;box-shadow:0 2px 12px #0001;border-radius:12px;overflow:hidden;background:var(--bg-primary);">
        <thead style="background:var(--bg-tertiary);">
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Period</th>
            <th>Spent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        ${uniqueBudgets.map(b => {
            const spent = txs.filter(tx => tx.category === b.category && tx.type === 'expense')
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            const percent = Math.round((spent/b.amount)*100)||0;
            const periodLabel = b.period.charAt(0).toUpperCase() + b.period.slice(1);
            return `<tr style="text-align:center;">
                <td>${b.category}</td>
                <td>${utils.formatCurrency(b.amount)}</td>
                <td>${periodLabel}</td>
                <td>
                  <div style="display:flex;flex-direction:column;align-items:center;">
                    <span>${utils.formatCurrency(spent)} <span style="color:${percent>100?'var(--danger-color)':'var(--primary-color)'};font-weight:bold;">(${percent}%)</span></span>
                    <div class="progress-bar" style="width:100px;height:8px;background:#e2e8f0;border-radius:4px;margin-top:6px;">
                      <div class="progress-bar-inner" style="height:8px;border-radius:4px;background:${percent>100?'var(--danger-color)':'var(--primary-color)'};width:${Math.min(percent,120)}%;transition:width .3s;"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" style="padding:0.5rem 1.2rem;font-size:1rem;border-radius:8px;margin-bottom:0.5rem;" onclick="editBudget('${b.id}')">Edit</button><br>
                  <button class="btn btn-danger btn-sm" style="padding:0.5rem 1.2rem;font-size:1rem;border-radius:8px;" onclick="deleteBudget('${b.id}')">Delete</button>
                </td>
            </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>`;
}

window.editBudget = function(id) {
    const budget = (window.app.state.budgets || []).find(b => b.id === id);
    if (!budget) return;
    // Fill the form with the budget's data
    document.getElementById('budget-category').value = budget.category;
    document.getElementById('budget-amount').value = budget.amount;
    document.getElementById('budget-period').value = budget.period;
    // Set edit mode
    window.budgetEditId = id;
    // Change button text to 'Update Budget'
    const addBtn = document.querySelector('.budget-add-btn');
    if (addBtn) addBtn.textContent = 'Update Budget';
};

// Patch the form submit to handle edit mode
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    // Patch budget form submit for edit
    const form = document.getElementById('budget-form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            const category = form['budget-category'].value;
            const amount = parseFloat(form['budget-amount'].value);
            const period = form['budget-period'].value;
            if (!category || !amount || !period) return;
            if (window.budgetEditId) {
                // Update existing budget
                window.app.state.budgets.push({ id: window.budgetEditId, category, amount, period });
                window.budgetEditId = null;
                const addBtn = document.querySelector('.budget-add-btn');
                if (addBtn) addBtn.textContent = 'Add Budget';
            } else {
                // Add new budget
                window.app.state.budgets.push({ id: utils.generateId(), category, amount, period });
            }
            Storage.saveBudgets(window.app.state.budgets);
            renderBudgetsList();
            form.reset();
        };
    }
});

function renderBillsPage() {
    const page = document.getElementById('bills-page');
    if (!page) return;
    page.innerHTML = '<h2>Bills</h2><div class="empty-state"><p>Bill reminders coming soon!</p></div>';
}

function renderGoalsPage() {
    const page = document.getElementById('goals-page');
    if (!page) return;
    page.innerHTML = '<h2>Goals</h2><div class="empty-state"><p>Goal setting coming soon!</p></div>';
}

function renderReportsPage() {
    const page = document.getElementById('reports-page');
    if (!page) return;
    page.innerHTML = '<h2>Reports</h2><div class="empty-state"><p>Reports and analytics coming soon!</p></div>';
}

function handleTabRendering() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page === 'dashboard') {
                updateDashboardSummary();
                renderRecentTransactions();
            } else if (page === 'transactions') {
                renderTransactionsPage();
            } else if (page === 'budgets') {
                renderBudgetsPage();
            } else if (page === 'bills') {
                renderBillsPage();
            } else if (page === 'goals') {
                renderGoalsPage();
            } else if (page === 'reports') {
                renderReportsPage();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Robust Theme toggle
    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.removeAttribute('data-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class=\"fas fa-moon\"></i>';
        }
    }
    const themeToggle = document.getElementById('theme-toggle');
    // Set theme on load
    setTheme(localStorage.getItem('theme'));
    if (themeToggle) {
        themeToggle.onclick = function() {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        };
    }
    handleTabRendering();
    // Render default dashboard and transactions page content
    renderTransactionsPage();
    renderBudgetsPage();
    renderBillsPage();
    renderGoalsPage();
    renderReportsPage();
});
// --- END BUDGET FUNCTIONALITY ---
