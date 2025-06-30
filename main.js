// --- BEGIN STATIC WEBSITE CODE ---
// Utility functions and classes
// (Moved all utility functions to utils.js)

// --- END UTILS ---

/**
 * Notification service for showing success/error messages.
 */
class NotificationService {
    /** Show a success message. */
    static showSuccess(message) {
        alert(message); // Replace with custom UI if desired
    }
    /** Show an error message. */
    static showError(message) {
        alert('Error: ' + message);
    }
}

/**
 * Main app state and methods for transactions, budgets, bills, and goals.
 */
class FinanceApp {
    constructor() {
        this.state = {
            transactions: Storage.getTransactions(),
            budgets: Storage.getBudgets(),
            bills: Storage.getBills(),
            goals: Storage.getGoals()
        };
    }
    /** Add a new transaction. */
    addTransaction(tx) {
        tx.id = utils.generateId();
        this.state.transactions.push(tx);
        Storage.saveTransactions(this.state.transactions);
        NotificationService.showSuccess('Transaction added!');
    }
    /** Update an existing transaction by ID. */
    updateTransaction(id, data) {
        const idx = this.state.transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
            this.state.transactions[idx] = { ...this.state.transactions[idx], ...data };
            Storage.saveTransactions(this.state.transactions);
            NotificationService.showSuccess('Transaction updated!');
        }
    }
    /** Delete a transaction by ID. */
    deleteTransaction(id) {
        this.state.transactions = this.state.transactions.filter(t => t.id !== id);
        Storage.saveTransactions(this.state.transactions);
        NotificationService.showSuccess('Transaction deleted!');
    }
    /** Get all transactions. */
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
    document.getElementById('loading-screen')?.style.setProperty('display', 'none');
    // Show main app container
    document.getElementById('app')?.style.setProperty('display', 'flex');
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const page = item.getAttribute('data-page');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(page + '-page')?.classList.add('active');
            // Render dynamic pages
            if (page === 'calendar') renderCalendarPage();
            if (page === 'reports') renderReportsPage();
            if (page === 'budgets') renderBudgetsPage();
            if (page === 'bills') renderBillsPage();
            if (page === 'goals') renderGoalsPage();
            if (page === 'trends') renderTrendsPage();
        });
    });
    // Add Transaction button
    document.getElementById('add-transaction-btn')?.addEventListener('click', () => {
        document.getElementById('transaction-modal').style.display = 'flex';
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
    // Initial render
    populateCategoryDropdown();
    renderRecentTransactions();
    updateDashboardSummary();
    handleTransactionForm();
    renderCategoryChart();
    renderIncomeExpenseChart();
    // Render calendar/reports if active
    if (document.querySelector('.menu-item[data-page="calendar"]')?.classList.contains('active')) renderCalendarPage();
    if (document.getElementById('reports-page')?.classList.contains('active')) renderReportsPage();
    // Theme toggle (dark mode)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Set initial icon
        function updateThemeIcon() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            themeToggle.innerHTML = isDark
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
        }
        updateThemeIcon();
        themeToggle.onclick = function() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
            updateThemeIcon();
        };
        // On load, respect saved theme
        document.addEventListener('DOMContentLoaded', () => {
            const saved = localStorage.getItem('theme');
            if (saved) document.documentElement.setAttribute('data-theme', saved);
            updateThemeIcon();
        });
    }
});
// --- END STATIC WEBSITE CODE ---

// --- BEGIN ENHANCEMENTS FOR FULL FUNCTIONALITY ---

// Utility/chart helper functions moved to utils.js

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
    // Render bulk delete controls and transaction items
    container.innerHTML = `
        <div class="recent-tx-controls" style="margin-bottom:10px;">
            <button id="bulk-delete-btn" class="btn btn-danger btn-sm" style="display:none;">
                <i class="fas fa-trash"></i> Delete Selected
            </button>
        </div>
        <div class="transaction-list">
            ${txs.map(tx => `
                <div class="transaction-item">
                    <input type="checkbox" class="tx-bulk-checkbox" data-id="${tx.id}" style="margin-right:8px;">
                    <div class="transaction-icon ${tx.type}"><i class="fas fa-${tx.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i></div>
                    <div class="transaction-details">
                        <div class="transaction-description">${tx.description}</div>
                        <div class="transaction-category">${tx.category}</div>
                        ${tx.notes ? `<div class='transaction-notes'><i class='fas fa-sticky-note'></i> ${tx.notes}</div>` : ''}
                        ${tx.attachment ? `<div class='transaction-attachment'><i class='fas fa-paperclip'></i> <a href='${tx.attachment.dataUrl}' target='_blank' download='${tx.attachment.name}'>${tx.attachment.name}</a></div>` : ''}
                    </div>
                    <div class="transaction-meta">
                        <div class="transaction-date">${utils.formatDate(tx.date)}</div>
                        <div class="transaction-amount ${tx.type}">${utils.formatCurrency(tx.amount)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    // Bulk delete logic
    setTimeout(() => {
        const checkboxes = container.querySelectorAll('.tx-bulk-checkbox');
        const bulkBtn = document.getElementById('bulk-delete-btn');
        // Show/hide bulk delete button based on selection
        checkboxes.forEach(cb => cb.addEventListener('change', () => {
            const anyChecked = Array.from(checkboxes).some(c => c.checked);
            bulkBtn.style.display = anyChecked ? 'inline-block' : 'none';
        }));
        // Bulk delete selected transactions
        bulkBtn.addEventListener('click', () => {
            const ids = Array.from(checkboxes).filter(c => c.checked).map(c => c.getAttribute('data-id'));
            if (ids.length && confirm('Delete selected transactions?')) {
                ids.forEach(id => window.transactionManager.delete(id));
                updateDashboardSummary();
                renderRecentTransactions();
                if (typeof renderTransactionsPage === 'function') renderTransactionsPage();
            }
        });
    }, 0);
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
    form.onsubmit = async function(e) {
        e.preventDefault();
        const type = form['type'].value;
        const amount = form['amount'].value;
        const description = form['description'].value;
        const category = form['category'].value;
        const date = form['date'].value;
        const notes = form['notes'] ? form['notes'].value : '';
        let attachment = null;
        if (form['attachment'] && form['attachment'].files && form['attachment'].files[0]) {
            const file = form['attachment'].files[0];
            if (file.size > 1024 * 1024) {
                NotificationService.showError('Attachment too large (max 1MB).');
                return;
            }
            attachment = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve({
                    name: file.name,
                    type: file.type,
                    dataUrl: e.target.result
                });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        if (!type || !amount || !description || !category || !date) return;
        window.transactionManager.add({ type, amount, description, category, date, notes, attachment });
        document.getElementById('transaction-modal').style.display = 'none';
        form.reset();
        updateDashboardSummary();
        renderRecentTransactions();
    };
}

// Remove local chart helpers (now in utils.js)
// function getChartFontColor() { ... }
// function getChartFontSize() { ... }
// function getBarLabelColor(ctx) { ... }

function renderIncomeExpenseChart() {
    const ctx = document.getElementById('income-expense-chart');
    if (!ctx) return;
    const txs = window.app.getTransactions();
    let income = 0, expenses = 0;
    txs.forEach(tx => {
        if (tx.type === 'income') income += parseFloat(tx.amount);
        else expenses += parseFloat(tx.amount);
    });
    if (window.incomeExpenseChart) window.incomeExpenseChart.destroy();
    window.incomeExpenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['rgba(16,185,129,0.9)', 'rgba(239,68,68,0.9)'],
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: utils.getChartFontColor(),
                        font: { size: utils.getChartFontSize() }
                    }
                }
            }
        }
    });
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
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: categories.map((_, i) => i % 2 === 0 ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)'),
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: utils.getChartFontColor(),
                        font: { size: utils.getChartFontSize() }
                    }
                }
            }
        }
    });
}

function renderCashFlowChart() {
    const ctx = document.getElementById('cash-flow-chart');
    if (!ctx) return;
    const txs = window.app.getTransactions();
    const monthly = {};
    txs.forEach(tx => {
        const ym = tx.date.slice(0, 7);
        if (!monthly[ym]) monthly[ym] = { income: 0, expense: 0 };
        if (tx.type === 'income') monthly[ym].income += parseFloat(tx.amount);
        if (tx.type === 'expense') monthly[ym].expense += parseFloat(tx.amount);
    });
    const months = Object.keys(monthly).sort();
    const incomeData = months.map(m => monthly[m].income);
    const expenseData = months.map(m => monthly[m].expense);
    if (window.cashFlowChart) window.cashFlowChart.destroy();
    window.cashFlowChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: 'rgba(16,185,129,1)',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: 'rgba(239,68,68,1)',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: true },
                datalabels: { display: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: utils.getChartFontColor() } },
                y: { grid: { color: 'rgba(100,116,139,0.12)' }, ticks: { color: utils.getChartFontColor(), beginAtZero: true } }
            }
        }
    });
}

function renderNetWorthChart() {
    const ctx = document.getElementById('net-worth-chart');
    if (!ctx) return;
    const txs = window.app.getTransactions();
    const monthly = {};
    let runningNet = 0;
    txs
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach(tx => {
            const ym = tx.date.slice(0, 7);
            if (!monthly[ym]) monthly[ym] = 0;
            runningNet += (tx.type === 'income' ? 1 : -1) * parseFloat(tx.amount);
            monthly[ym] = runningNet;
        });
    const months = Object.keys(monthly).sort();
    const netWorthData = months.map(m => monthly[m]);
    if (window.netWorthChart) window.netWorthChart.destroy();
    window.netWorthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Net Worth',
                data: netWorthData,
                borderColor: 'rgba(59,130,246,1)',
                backgroundColor: 'rgba(59,130,246,0.1)',
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            plugins: {
                legend: { display: true },
                datalabels: { display: false }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: utils.getChartFontColor() } },
                y: { grid: { color: 'rgba(100,116,139,0.12)' }, ticks: { color: utils.getChartFontColor(), beginAtZero: true } }
            }
        }
    });
}

// Patch trends page rendering to call this
const origRenderTrendsPage = typeof renderTrendsPage === 'function' ? renderTrendsPage : null;
renderTrendsPage = function() {
    if (origRenderTrendsPage) origRenderTrendsPage();
    renderCashFlowChart();
    renderNetWorthChart();
};

document.addEventListener('DOMContentLoaded', () => {
    populateCategoryDropdown();
    renderRecentTransactions();
    updateDashboardSummary();
    handleTransactionForm();
    renderCategoryChart();
    renderIncomeExpenseChart();
    // Optionally, re-render charts when transactions change
});

function showChartPlaceholders() {
    // Spending Trends
    const trendsChart = document.getElementById('trends-chart');
    const trendsPlaceholder = document.getElementById('trends-chart-placeholder');
    if (trendsChart && trendsPlaceholder) {
        const txs = window.app.getTransactions();
        if (!txs.length) {
            trendsChart.style.display = 'none';
            trendsPlaceholder.style.display = 'block';
        } else {
            trendsChart.style.display = 'block';
            trendsPlaceholder.style.display = 'none';
        }
    }
    // Cash Flow
    const cashFlowChart = document.getElementById('cash-flow-chart');
    const cashFlowPlaceholder = document.getElementById('cash-flow-chart-placeholder');
    if (cashFlowChart && cashFlowPlaceholder) {
        const txs = window.app.getTransactions();
        if (!txs.some(tx => tx.type === 'income' || tx.type === 'expense')) {
            cashFlowChart.style.display = 'none';
            cashFlowPlaceholder.style.display = 'block';
        } else {
            cashFlowChart.style.display = 'block';
            cashFlowPlaceholder.style.display = 'none';
        }
    }
    // Net Worth
    const netWorthChart = document.getElementById('net-worth-chart');
    const netWorthPlaceholder = document.getElementById('net-worth-chart-placeholder');
    if (netWorthChart && netWorthPlaceholder) {
        const txs = window.app.getTransactions();
        if (!txs.length) {
            netWorthChart.style.display = 'none';
            netWorthPlaceholder.style.display = 'block';
        } else {
            netWorthChart.style.display = 'block';
            netWorthPlaceholder.style.display = 'none';
        }
    }
}
// Call after rendering charts and on page load
renderTrendsPage = (function(orig) {
    return function() {
        if (typeof orig === 'function') orig();
        showChartPlaceholders();
    };
})(typeof renderTrendsPage === 'function' ? renderTrendsPage : null);
document.addEventListener('DOMContentLoaded', showChartPlaceholders);

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
                        ${tx.notes ? `<div class='transaction-notes'><i class='fas fa-sticky-note'></i> ${tx.notes}</div>` : ''}
                        ${tx.attachment ? `<div class='transaction-attachment'><i class='fas fa-paperclip'></i> <a href='${tx.attachment.dataUrl}' target='_blank' download='${tx.attachment.name}'>${tx.attachment.name}</a></div>` : ''}
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
    const budgets = Storage.getBudgets();
    page.innerHTML = `
        <div class="budgets-card">
            <div class="budgets-header-row">
                <h2 class="budgets-title">Budgets</h2>
            </div>
            <div class="budgets-chart-container">
                <canvas id="budgets-pie-chart" width="380" height="380"></canvas>
            </div>
            <div id="budgets-list"></div>
        </div>
    `;
    renderBudgetsList();
    renderBudgetsPieChart(budgets);
}

function renderBudgetsPieChart(budgets) {
    const ctx = document.getElementById('budgets-pie-chart');
    if (!ctx || !budgets.length) return;
    const labels = budgets.map(b => b.name);
    const data = budgets.map(b => Number(b.amount) || 0);
    const backgroundColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6', '#06b6d4', '#f87171', '#34d399', '#fbbf24', '#6366f1'
    ];
    if (window.budgetsPieChart) window.budgetsPieChart.destroy();
    window.budgetsPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { color: getChartFontColor() } },
                datalabels: {
                    color: getChartFontColor(),
                    font: { weight: 'bold', size: 16 },
                    formatter: v => v ? v : ''
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderBudgetsList() {
    const container = document.getElementById('budgets-list');
    if (!container) return;
    container.innerHTML = '';
    const budgets = (window.app.state.budgets || []);
    // Remove duplicates by category (keep first occurrence)
    const uniqueBudgets = [];
    const seen = new Set();
    for (const b of budgets) {
        if (!seen.has(b.category)) {
            uniqueBudgets.push(b);
            seen.add(b.category);
        }
    }
    if (uniqueBudgets.length === 0) {
        container.innerHTML = '<div id="budgets-list-card"><div class="text-center">No budgets set yet.</div></div>';
        return;
    }
    // Get all transactions for spent calculation
    const transactions = window.app.getTransactions ? window.app.getTransactions() : Storage.getTransactions();
    // Render the table dynamically
    const table = document.createElement('table');
    table.className = 'budget-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Spent</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${uniqueBudgets.map(budget => {
                // Calculate spent for this category
                const spent = transactions
                    .filter(tx => tx.type === 'expense' && tx.category === budget.category)
                    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
                return `
                <tr>
                    <td>${budget.category}</td>
                    <td>${window.utils.formatCurrency(budget.amount)}</td>
                    <td>${window.utils.formatCurrency(spent)}</td>
                    <td>
                        <button class="btn btn-edit" onclick="editBudget('${budget.id}')">Edit</button>
                        <button class="btn btn-delete" onclick="deleteBudget('${budget.id}')">Delete</button>
                    </td>
                </tr>`;
            }).join('')}
        </tbody>
    `;
    const card = document.createElement('div');
    card.id = 'budgets-list-card';
    card.appendChild(table);
    container.appendChild(card);
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

// Ensure deleteBudget is globally available
window.deleteBudget = function(id) {
    const budgets = window.app.state.budgets || [];
    const newBudgets = budgets.filter(b => b.id !== id);
    window.app.state.budgets = newBudgets;
    Storage.saveBudgets(newBudgets);
    renderBudgetsList();
};

// Prevent duplicate budgets on add
function handleBudgetFormSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('budget-category').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);
    const period = document.getElementById('budget-period').value;
    if (!category || isNaN(amount) || !period) return;
    const budgets = window.app.state.budgets || [];
    if (budgets.some(b => b.category === category)) {
        NotificationService.showError('A budget for this category already exists.');
        return;
    }
    const newBudget = {
        id: utils.generateId(),
        category,
        amount,
        period
    };
    budgets.push(newBudget);
    window.app.state.budgets = budgets;
    Storage.saveBudgets(budgets);
    renderBudgetsList();
    e.target.reset();
}
// Patch the form submit event
let budgetForm = document.getElementById('budget-form');
if (budgetForm) {
    budgetForm.onsubmit = handleBudgetFormSubmit;
}

function renderBillsPage() {
    const page = document.getElementById('bills-page');
    if (!page) return;
    let bills = Storage.getBills();
    if (!bills.length) {
        page.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice-dollar"></i>
                <p>No bills yet. Add one to get started!</p>
                <button class="btn btn-primary" id="add-bill-btn-empty">+ Add Bill</button>
            </div>`;
        document.getElementById('add-bill-btn-empty').onclick = () => {
            showBillModal();
        };
        return;
    }
    page.innerHTML = `
        <div class="bills-card">
            <div class="bills-header-row">
                <h2 class="bills-title">Bills</h2>
                <button class="btn btn-primary" id="add-bill-btn">+ Add Bill</button>
            </div>
            <div id="bills-list"></div>
        </div>
        <div id="bill-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header"><h2>Add Bill</h2></div>
                <form id="bill-form" class="modal-body">
                    <div class="form-group">
                        <label for="bill-name">Name</label>
                        <input type="text" id="bill-name" name="name" required />
                    </div>
                    <div class="form-group">
                        <label for="bill-amount">Amount</label>
                        <input type="number" id="bill-amount" name="amount" step="0.01" min="0.01" required />
                    </div>
                    <div class="form-group">
                        <label for="bill-date">Due Date</label>
                        <input type="date" id="bill-date" name="date" required />
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-bill">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Bill</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    renderBillsList();
    // Modal logic
    document.getElementById('add-bill-btn').onclick = () => {
        document.getElementById('bill-modal').classList.add('show');
    };
    document.getElementById('cancel-bill').onclick = () => {
        document.getElementById('bill-modal').classList.remove('show');
    };
    document.getElementById('bill-modal').onclick = (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('show');
        }
    };
    document.getElementById('bill-form').onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('bill-name').value.trim();
        const amount = parseFloat(document.getElementById('bill-amount').value);
        const date = document.getElementById('bill-date').value;
        if (!name || isNaN(amount) || !date) return;
        let bills = Storage.getBills();
        bills.push({ id: utils.generateId(), name, amount, date, status: 'upcoming' });
        Storage.saveBills(bills);
        renderBillsList();
        document.getElementById('bill-modal').classList.remove('show');
        e.target.reset();
    };
}

function renderBillsList() {
    const container = document.getElementById('bills-list');
    if (!container) return;
    const bills = Storage.getBills();
    if (!bills.length) {
        container.innerHTML = '<div class="bills-empty">No bills yet. Add one to get started!</div>';
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    container.innerHTML = `
        <table class="bills-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${bills.map(bill => {
                    let status = bill.status || 'upcoming';
                    if (status !== 'done' && bill.date < today) status = 'overdue';
                    let statusClass = '';
                    if (status === 'overdue') statusClass = 'bill-status-overdue';
                    if (status === 'done') statusClass = 'bill-status-done';
                    // Button: checkmark for not done, undo for done
                    let toggleBtn = status === 'done'
                        ? `<button class="btn btn-success" title="Mark as not done" onclick="toggleBillStatus('${bill.id}')">↩️</button>`
                        : `<button class="btn btn-success" title="Mark as done" onclick="toggleBillStatus('${bill.id}')">✅</button>`;
                    return `
                    <tr>
                        <td>${bill.name}</td>
                        <td>${window.utils.formatCurrency(bill.amount)}</td>
                        <td>${bill.date}</td>
                        <td class="${statusClass}">${status}</td>
                        <td>
                            ${toggleBtn}
                            <button class="btn btn-delete" onclick="deleteBill('${bill.id}')">Delete</button>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

window.toggleBillStatus = function(id) {
    const bills = Storage.getBills();
    const idx = bills.findIndex(b => b.id === id);
    if (idx !== -1) {
        if (bills[idx].status === 'done') {
            bills[idx].status = 'upcoming';
        } else {
            bills[idx].status = 'done';
        }
        Storage.saveBills(bills);
        renderBillsList();
    }
};

window.deleteBill = function(id) {
    const bills = Storage.getBills();
    const newBills = bills.filter(b => b.id !== id);
    Storage.saveBills(newBills);
    renderBillsList();
};

function renderGoalsPage() {
    const page = document.getElementById('goals-page');
    if (!page) return;
    const goals = Storage.getGoals();
    if (!goals.length) {
        page.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullseye"></i>
                <p>No goals yet. Add one to get started!</p>
                <button class="btn btn-primary" id="add-goal-btn-empty">+ Add Goal</button>
            </div>`;
        document.getElementById('add-goal-btn-empty').onclick = () => {
            showGoalModal();
        };
        return;
    }
    page.innerHTML = `
        <div class="bills-card goals-card">
            <div class="bills-header-row">
                <h2 class="bills-title">Goals</h2>
                <button class="btn btn-primary" id="add-goal-btn">+ Add Goal</button>
            </div>
            <div id="goals-list"></div>
        </div>
        <div id="goal-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header"><h2 id="goal-modal-title">Add Goal</h2></div>
                <form id="goal-form" class="modal-body">
                    <div class="form-group">
                        <label for="goal-name">Name</label>
                        <input type="text" id="goal-name" name="name" required />
                    </div>
                    <div class="form-group">
                        <label for="goal-amount">Target Amount</label>
                        <input type="number" id="goal-amount" name="amount" step="0.01" min="0.01" required />
                    </div>
                    <div class="form-group">
                        <label for="goal-date">Target Date</label>
                        <input type="date" id="goal-date" name="date" required />
                    </div>
                    <div class="form-group">
                        <label for="goal-desc">Description (optional)</label>
                        <textarea id="goal-desc" name="desc" rows="2"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-goal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Goal</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    renderGoalsList();
    // Modal logic
    document.getElementById('add-goal-btn').onclick = () => {
        document.getElementById('goal-modal').classList.add('show');
        document.getElementById('goal-modal-title').textContent = 'Add Goal';
        document.getElementById('goal-form').reset();
        window.goalEditId = null;
    };
    document.getElementById('cancel-goal').onclick = () => {
        document.getElementById('goal-modal').classList.remove('show');
    };
    document.getElementById('goal-modal').onclick = (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('show');
        }
    };
    document.getElementById('goal-form').onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('goal-name').value.trim();
        const amount = parseFloat(document.getElementById('goal-amount').value);
        const date = document.getElementById('goal-date').value;
        const desc = document.getElementById('goal-desc').value.trim();
        if (!name || isNaN(amount) || !date) return;
        let goals = Storage.getGoals();
        if (window.goalEditId) {
            // Edit
            goals = goals.map(g => g.id === window.goalEditId ? { ...g, name, amount, date, desc } : g);
            window.goalEditId = null;
        } else {
            // Add
            goals.push({ id: utils.generateId(), name, amount, date, desc, saved: 0, status: 'active' });
        }
        Storage.saveGoals(goals);
        renderGoalsList();
        document.getElementById('goal-modal').classList.remove('show');
        e.target.reset();
    };
}

function renderGoalsList() {
    const container = document.getElementById('goals-list');
    if (!container) return;
    const goals = Storage.getGoals();
    if (!goals.length) {
        container.innerHTML = '<div class="bills-empty">No goals yet. Add one to get started!</div>';
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    container.innerHTML = `
        <table class="bills-table goals-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Target</th>
                    <th>Saved</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${goals.map(goal => {
                    let status = goal.status || 'active';
                    if (status !== 'completed' && goal.date < today) status = 'overdue';
                    if (goal.saved >= goal.amount) status = 'completed';
                    let statusClass = '';
                    if (status === 'overdue') statusClass = 'bill-status-overdue';
                    if (status === 'completed') statusClass = 'bill-status-done';
                    // Progress bar
                    const percent = Math.min(100, Math.round((goal.saved / goal.amount) * 100));
                    let progressBar = `<div style="background:#e2e8f0;width:100%;height:14px;border-radius:8px;overflow:hidden;">
                        <div style="background:var(--primary-color);width:${percent}%;height:100%;transition:width 0.3s;"></div>
                    </div>
                    <div style="font-size:0.95em;margin-top:2px;">${percent}%</div>`;
                    // Actions
                    let actions = `
                        <button class="btn btn-edit" title="Edit" onclick="editGoal('${goal.id}')">Edit</button>
                        <button class="btn btn-delete" title="Delete" onclick="deleteGoal('${goal.id}')">Delete</button>
                        <button class="btn btn-success" title="Add Savings" onclick="addToGoal('${goal.id}')">💰</button>
                    `;
                    return `
                    <tr>
                        <td><b>${goal.name}</b><br><span style="font-size:0.95em;color:var(--text-secondary)">${goal.desc || ''}</span></td>
                        <td>${window.utils.formatCurrency(goal.amount)}</td>
                        <td>${window.utils.formatCurrency(goal.saved || 0)}</td>
                        <td>${goal.date}</td>
                        <td class="${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</td>
                        <td>${progressBar}</td>
                        <td>${actions}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

window.editGoal = function(id) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    document.getElementById('goal-modal').classList.add('show');
    document.getElementById('goal-modal-title').textContent = 'Edit Goal';
    document.getElementById('goal-name').value = goal.name;
    document.getElementById('goal-amount').value = goal.amount;
    document.getElementById('goal-date').value = goal.date;
    document.getElementById('goal-desc').value = goal.desc || '';
    window.goalEditId = id;
};

window.deleteGoal = function(id) {
    let goals = Storage.getGoals();
    let goal = goals.find(g => g.id === id);
    if (goal && goal.saved && goal.saved > 0) {
        // Add transaction for returning money to account
        const returnTx = {
            type: 'income',
            category: 'Savings',
            amount: goal.saved,
            date: new Date().toISOString().slice(0, 10),
            description: `Goal deleted: ${goal.name}`
        };
        let txs = (window.app && typeof window.app.getTransactions === 'function') ? window.app.getTransactions() : Storage.getTransactions();
        if (window.app && typeof window.app.addTransaction === 'function') {
            window.app.addTransaction(returnTx);
        } else {
            returnTx.id = utils.generateId();
            txs.push(returnTx);
            Storage.saveTransactions(txs);
        }
    }
    goals = goals.filter(g => g.id !== id);
    Storage.saveGoals(goals);
    renderGoalsList();
    NotificationService.showSuccess('Goal Deleted');
};

window.addToGoal = function(id) {
    const amount = prompt('How much would you like to add to this goal?');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    // Calculate current balance
    let txs = (window.app && typeof window.app.getTransactions === 'function') ? window.app.getTransactions() : Storage.getTransactions();
    let balance = txs.reduce((sum, tx) => {
        if (tx.type === 'income') return sum + parseFloat(tx.amount);
        if (tx.type === 'expense') return sum - parseFloat(tx.amount);
        return sum;
    }, 0);
    if (amt > balance) {
        NotificationService.showError('Insufficient funds in your account to add this amount to your goal.');
        return;
    }
    let goals = Storage.getGoals();
    let goal = goals.find(g => g.id === id);
    if (!goal) return;
    // Add transaction for savings withdrawal
    const tx = {
        type: 'expense',
        category: 'Savings',
        amount: amt,
        date: new Date().toISOString().slice(0, 10),
        description: `Added to goal: ${goal.name}`
    };
    if (window.app && typeof window.app.addTransaction === 'function') {
        window.app.addTransaction(tx);
    } else {
        tx.id = utils.generateId();
        txs.push(tx);
        Storage.saveTransactions(txs);
    }
    // Update goal
    let updatedGoals = goals.map(g => {
        if (g.id === id) {
            let newSaved = (g.saved || 0) + amt;
            // If goal is reached or exceeded, mark as achieved and return money
            if (newSaved >= g.amount) {
                // Add transaction for returning money to account
                const returnTx = {
                    type: 'income',
                    category: 'Savings',
                    amount: g.amount,
                    date: new Date().toISOString().slice(0, 10),
                    description: `Goal achieved: ${g.name}`
                };
                if (window.app && typeof window.app.addTransaction === 'function') {
                    window.app.addTransaction(returnTx);
                } else {
                    returnTx.id = utils.generateId();
                    txs.push(returnTx);
                    Storage.saveTransactions(txs);
                }
                return { ...g, saved: g.amount, status: 'achieved' };
            }
            return { ...g, saved: newSaved };
        }
        return g;
    });
    Storage.saveGoals(updatedGoals);
    renderGoalsList();
};

function showGoalModal() {
    let modal = document.getElementById('goal-modal');
    if (!modal) {
        // Create modal if not present
        modal = document.createElement('div');
        modal.id = 'goal-modal';
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header"><h2 id="goal-modal-title">Add Goal</h2></div>
                <form id="goal-form" class="modal-body">
                    <div class="form-group">
                        <label for="goal-name">Name</label>
                        <input type="text" id="goal-name" name="name" required />
                    </div>
                    <div class="form-group">
                        <label for="goal-amount">Target Amount</label>
                        <input type="number" id="goal-amount" name="amount" step="0.01" min="0.01" required />
                    </div>
                    <div class="form-group">
                        <label for="goal-date">Target Date</label>
                        <input type="date" id="goal-date" name="date" required />
                    </div>
                    <div class="form-group">
                        <label for="goal-desc">Description (optional)</label>
                        <textarea id="goal-desc" name="desc" rows="2"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-goal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Goal</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(modal);
    } else {
        modal.classList.add('show');
    }
    document.getElementById('goal-form').onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('goal-name').value.trim();
        const amount = parseFloat(document.getElementById('goal-amount').value);
        const date = document.getElementById('goal-date').value;
        const desc = document.getElementById('goal-desc').value.trim();
        if (!name || isNaN(amount) || !date) return;
        let goals = Storage.getGoals();
        goals.push({ id: utils.generateId(), name, amount, date, desc, saved: 0, status: 'active' });
        Storage.saveGoals(goals);
        modal.classList.remove('show');
        renderGoalsPage();
    };
    document.getElementById('cancel-goal').onclick = () => {
        modal.classList.remove('show');
    };
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('show');
    };
}

// --- Recurring Options Rendering ---
// Ensure recurring options (when/frequency) are rendered and handled
function renderRecurringOptions() {
    const container = document.getElementById('recurring-options');
    if (!container) return;
    container.innerHTML = `
      <div class="recurring-row">
        <div class="recurring-col">
          <label for="recurring-interval">Every</label>
          <input type="number" id="recurring-interval" name="recurring-interval" min="1" value="1" class="recurring-input">
        </div>
        <div class="recurring-col">
          <label for="recurring-frequency" class="visually-hidden">Frequency</label>
          <select id="recurring-frequency" name="recurring-frequency" class="recurring-input">
            <option value="day">Day(s)</option>
            <option value="week">Week(s)</option>
            <option value="month">Month(s)</option>
            <option value="year">Year(s)</option>
          </select>
        </div>
        <div class="recurring-col recurring-next">
          <label for="recurring-next-date">Next on</label>
          <input type="date" id="recurring-next-date" name="recurring-next-date" class="recurring-input">
        </div>
      </div>
    `;
}
// Show/hide recurring options based on checkbox
const recurringCheckbox = document.getElementById('transaction-recurring');
if (recurringCheckbox) {
    recurringCheckbox.addEventListener('change', function() {
        const options = document.getElementById('recurring-options');
        if (this.checked) {
            renderRecurringOptions();
            options.style.display = 'flex';
        } else {
            options.innerHTML = '';
            options.style.display = 'none';
        }
    });
    // Initial state
    if (recurringCheckbox.checked) {
        renderRecurringOptions();
        document.getElementById('recurring-options').style.display = 'flex';
    } else {
        document.getElementById('recurring-options').style.display = 'none';
    }
}

// --- Transaction Templates ---
const TEMPLATE_KEY = 'transactionTemplates';
function getTemplates() {
    return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]');
}
function saveTemplates(templates) {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
}
function populateTemplateDropdown() {
    const select = document.getElementById('transaction-template-select');
    if (!select) return;
    const templates = getTemplates();
    select.innerHTML = '<option value="">Select a template...</option>' +
        templates.map((tpl, i) => `<option value="${i}">${tpl.description || 'Template ' + (i+1)}</option>`).join('');
}
document.addEventListener('DOMContentLoaded', () => {
    populateTemplateDropdown();
    // Template select fill form
    document.getElementById('transaction-template-select')?.addEventListener('change', function() {
        const idx = this.value;
        if (!idx) return;
        const tpl = getTemplates()[idx];
        if (!tpl) return;
        document.getElementById('transaction-type').value = tpl.type;
        document.getElementById('transaction-amount').value = tpl.amount;
        document.getElementById('transaction-description').value = tpl.description;
        document.getElementById('transaction-category').value = tpl.category;
        document.getElementById('transaction-date').value = tpl.date;
        document.getElementById('transaction-tags').value = tpl.tags || '';
        document.getElementById('transaction-notes').value = tpl.notes || '';
    });
    // Save as template
    document.getElementById('save-template-btn')?.addEventListener('click', function() {
        const type = document.getElementById('transaction-type').value;
        const amount = document.getElementById('transaction-amount').value;
        const description = document.getElementById('transaction-description').value;
        const category = document.getElementById('transaction-category').value;
        const date = document.getElementById('transaction-date').value;
        const tags = document.getElementById('transaction-tags').value;
        const notes = document.getElementById('transaction-notes').value;
        if (!type || !amount || !description || !category || !date) {
            NotificationService.showError('Fill out the form before saving as template.');
            return;
        }
        const templates = getTemplates();
        templates.push({ type, amount, description, category, date, tags, notes });
        saveTemplates(templates);
        populateTemplateDropdown();
        NotificationService.showSuccess('Template saved!');
    });
});
// --- END SUBTAB RENDERING ---

// --- BEGIN CALENDAR PAGE FUNCTIONALITY ---
function renderCalendarPage() {
    const page = document.getElementById('calendar-page');
    if (!page) return;
    // Get current month and year
    const today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();
    // Allow navigation between months
    page.innerHTML = `
        <div class="calendar-header">
            <button class="btn btn-secondary" id="calendar-prev">&lt;</button>
            <span id="calendar-month-label">${today.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button class="btn btn-secondary" id="calendar-next">&gt;</button>
        </div>
        <div id="calendar-table-container"></div>
        <div id="calendar-day-details" style="display:none;"></div>
    `;
    function updateCalendar(m, y) {
        // Update month label
        document.getElementById('calendar-month-label').textContent = new Date(y, m).toLocaleString('default', { month: 'long', year: 'numeric' });
        // Build calendar grid
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        let html = '<table class="calendar-table"><thead><tr>';
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        for (let d of days) html += `<th>${d}</th>`;
        html += '</tr></thead><tbody><tr>';
        let day = 1;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    html += '<td></td>';
                } else if (day > daysInMonth) {
                    html += '<td></td>';
                } else {
                    // Calculate total expenses for this day
                    const txs = window.app.getTransactions().filter(tx => tx.type === 'expense' && new Date(tx.date).getFullYear() === y && new Date(tx.date).getMonth() === m && new Date(tx.date).getDate() === day);
                    const total = txs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
                    html += `<td class="calendar-day" data-day="${day}">
                        <div class="calendar-date">${day}</div>
                        <div class="calendar-expense">${total > 0 ? utils.formatCurrency(total) : ''}</div>
                    </td>`;
                    day++;
                }
            }
            html += '</tr>';
            if (day > daysInMonth) break;
            if (i < 5) html += '<tr>';
        }
        html += '</tbody></table>';
        document.getElementById('calendar-table-container').innerHTML = html;
        // Add click handlers for days
        document.querySelectorAll('.calendar-day').forEach(td => {
            td.addEventListener('click', function() {
                const d = parseInt(this.getAttribute('data-day'));
                const txs = window.app.getTransactions().filter(tx => tx.type === 'expense' && new Date(tx.date).getFullYear() === y && new Date(tx.date).getMonth() === m && new Date(tx.date).getDate() === d);
                let details = `<h4>Expenses for ${d} ${new Date(y, m, d).toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>`;
                if (txs.length === 0) {
                    details += '<p>No expenses.</p>';
                } else {
                    details += '<ul>' + txs.map(tx => `<li>${utils.formatCurrency(tx.amount)} - ${tx.description} (${tx.category})</li>`).join('') + '</ul>';
                }
                const detailsDiv = document.getElementById('calendar-day-details');
                detailsDiv.innerHTML = details + '<button class="btn btn-secondary" id="calendar-close-details">Close</button>';
                detailsDiv.style.display = 'block';
                document.getElementById('calendar-close-details').onclick = () => { detailsDiv.style.display = 'none'; };
            });
        });
    }
    updateCalendar(month, year);
    document.getElementById('calendar-prev').onclick = () => {
        month--;
        if (month < 0) { month = 11; year--; }
        updateCalendar(month, year);
    };
    document.getElementById('calendar-next').onclick = () => {
        month++;
        if (month > 11) { month = 0; year++; }
        updateCalendar(month, year);
    };
}

// Patch navigation to render calendar page
const origSidebarNav = document.querySelectorAll('.menu-item');
if (origSidebarNav.length) {
    origSidebarNav.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page === 'calendar') renderCalendarPage();
        });
    });
}
// If user lands on calendar page directly (refresh)
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.menu-item[data-page="calendar"]').classList.contains('active')) {
        renderCalendarPage();
    }
});
// --- END CALENDAR PAGE FUNCTIONALITY ---

// --- BEGIN REPORTS PAGE FUNCTIONALITY ---
function renderReportsPage() {
    // Attach download handlers
    const txBtn = document.getElementById('download-transactions-btn');
    const accBtn = document.getElementById('download-account-btn');
    if (txBtn) {
        txBtn.onclick = function() {
            const txs = window.app.getTransactions();
            if (!txs.length) return NotificationService.showError('No transactions to export.');
            const csv = transactionsToCSV(txs);
            downloadCSV(csv, 'transactions.csv');
        };
    }
    if (accBtn) {
        accBtn.onclick = function() {
            const txs = window.app.getTransactions();
            if (!txs.length) return NotificationService.showError('No account history to export.');
            const csv = accountHistoryToCSV(txs);
            downloadCSV(csv, 'account_history.csv');
        };
    }
}

function transactionsToCSV(txs) {
    const header = ['ID','Type','Amount','Description','Category','Date'];
    const rows = txs.map(tx => [
        tx.id,
        tx.type,
        tx.amount,
        '"' + (tx.description || '').replace(/"/g, '""') + '"',
        tx.category,
        tx.date
    ]);
    return [header, ...rows].map(r => r.join(',')).join('\r\n');
}

function accountHistoryToCSV(txs) {
    // Account history: running balance after each transaction
    let balance = 0;
    const header = ['ID','Type','Amount','Description','Category','Date','Balance After'];
    const rows = txs.map(tx => {
        if (tx.type === 'income') balance += parseFloat(tx.amount);
        else if (tx.type === 'expense') balance -= parseFloat(tx.amount);
        return [
            tx.id,
            tx.type,
            tx.amount,
            '"' + (tx.description || '').replace(/"/g, '""') + '"',
            tx.category,
            tx.date,
            balance.toFixed(2)
        ];
    });
    return [header, ...rows].map(r => r.join(',')).join('\r\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Patch navigation to render reports page
const reportsMenuItem = document.querySelector('.menu-item[data-page="reports"]');
if (reportsMenuItem) {
    reportsMenuItem.addEventListener('click', renderReportsPage);
}
// If user lands on reports page directly (refresh)
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reports-page')?.classList.contains('active')) {
        renderReportsPage();
    }
});
// --- END REPORTS PAGE FUNCTIONALITY ---

// --- BEGIN DARK MODE TOGGLE FUNCTIONALITY ---
// --- Modern Theme Toggle Button Logic ---
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    // Set initial icon
    function updateThemeIcon() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeToggleBtn.innerHTML = isDark
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggleBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }
    updateThemeIcon();
    themeToggleBtn.onclick = function() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        updateThemeIcon();
    };
    // On load, respect saved theme
    document.addEventListener('DOMContentLoaded', () => {
        const saved = localStorage.getItem('theme');
        if (saved) document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon();
    });
}
// --- END DARK MODE TOGGLE FUNCTIONALITY ---

// --- BEGIN BILL REMINDERS ---
function showBillReminders() {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const upcoming = (window.app.state.bills || []).filter(bill => {
        if (!bill.date) return false;
        const billDate = new Date(bill.date);
        return billDate >= now && billDate <= soon;
    });
    if (upcoming.length) {
        const notifications = document.getElementById('notifications');
        if (notifications) {
            notifications.innerHTML = `<div class="notification info"><i class="fas fa-bell"></i> ${upcoming.length} bill(s) due within 7 days!</div>`;
            setTimeout(() => { notifications.innerHTML = ''; }, 8000);
        }
    }
}
document.addEventListener('DOMContentLoaded', showBillReminders);
// Also show reminders after adding/deleting bills
function afterBillChange() {
    updateDashboardSummary();
    showBillReminders();
}
// Patch bill add/delete logic if present
if (window.app && window.app.state && window.app.state.bills) {
    // If you have addBill/deleteBill methods, call afterBillChange() after them
}
// --- END BILL REMINDERS ---

// --- BEGIN DASHBOARD WIDGET VISIBILITY ---
const DASHBOARD_WIDGETS_KEY = 'dashboardWidgetsVisible';
function getDashboardWidgetsVisible() {
    return JSON.parse(localStorage.getItem(DASHBOARD_WIDGETS_KEY) || '{}');
}
function saveDashboardWidgetsVisible(obj) {
    localStorage.setItem(DASHBOARD_WIDGETS_KEY, JSON.stringify(obj));
}
function setupDashboardWidgetSettings() {
    const grid = document.querySelector('.summary-cards');
    if (!grid) return;
    // Add settings button
    let btn = document.getElementById('dashboard-widget-settings-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'dashboard-widget-settings-btn';
        btn.className = 'btn btn-secondary btn-sm';
        btn.innerHTML = '<i class="fas fa-cog"></i> Widgets';
        btn.style.marginBottom = '10px';
        grid.parentNode.insertBefore(btn, grid);
    }
    btn.onclick = () => {
        const visible = getDashboardWidgetsVisible();
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `<div class="modal-content"><div class="modal-header"><h2>Dashboard Widgets</h2></div><div class="modal-body">
            <label><input type="checkbox" data-widget="balance" ${visible.balance !== false ? 'checked' : ''}/> Total Balance</label><br>
            <label><input type="checkbox" data-widget="income" ${visible.income !== false ? 'checked' : ''}/> Monthly Income</label><br>
            <label><input type="checkbox" data-widget="expenses" ${visible.expenses !== false ? 'checked' : ''}/> Monthly Expenses</label><br>
            <label><input type="checkbox" data-widget="bills" ${visible.bills !== false ? 'checked' : ''}/> Upcoming Bills</label><br>
        </div><div class="modal-footer"><button class="btn btn-secondary" id="close-widget-modal">Close</button></div></div>`;
        document.body.appendChild(modal);
        modal.querySelectorAll('input[type=checkbox]').forEach(cb => {
            cb.addEventListener('change', () => {
                visible[cb.getAttribute('data-widget')] = cb.checked;
                saveDashboardWidgetsVisible(visible);
                renderDashboardWidgets();
            });
        });
        document.getElementById('close-widget-modal').onclick = () => modal.remove();
    };
}
function renderDashboardWidgets() {
    const visible = getDashboardWidgetsVisible();
    const cards = document.querySelectorAll('.summary-cards .card');
    if (!cards.length) return;
    // Order: balance, income, expenses, bills
    ['balance', 'income', 'expenses', 'bills'].forEach((key, i) => {
        if (cards[i]) cards[i].style.display = (visible[key] !== false) ? '' : 'none';
    });
}
document.addEventListener('DOMContentLoaded', () => {
    setupDashboardWidgetSettings();
    renderDashboardWidgets();
});

// --- BEGIN KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 't' || e.key === 'T') {
        document.getElementById('add-transaction-btn')?.click();
    }
    if (e.key >= '1' && e.key <= '7') {
        const pages = ['dashboard','transactions','budgets','bills','goals','reports','calendar','trends'];
        const idx = parseInt(e.key, 10) - 1;
        if (pages[idx]) {
            document.querySelector(`.menu-item[data-page="${pages[idx]}"]`)?.click();
        }
    }
});
// --- END KEYBOARD SHORTCUTS ---

// main.js - Main app logic for Personal Finance Dashboard
//
// Cross-file integration:
// - Uses utils.js for all formatting, ID generation, and chart helpers (window.utils)
// - Uses storage.js for all persistent data (window.Storage)
// - All DOM elements referenced are defined in index.html
// - Exports global objects for use in other scripts
// - See utils.js and storage.js for usage examples
//
// Example cross-link: use a utility and storage helper together
if (typeof window !== 'undefined' && window.utils && window.Storage) {
    // Log the formatted balance of all transactions
    const txs = window.Storage.getTransactions();
    const total = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    console.log('Total transaction amount:', window.utils.formatCurrency(total));
}
