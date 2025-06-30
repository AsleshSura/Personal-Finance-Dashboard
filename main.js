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

    // --- Utility Functions ---
    getTransactionsByCategory(category) {
        return this.state.transactions.filter(tx => tx.category === category);
    }

    getTransactionsByDateRange(start, end) {
        return this.state.transactions.filter(tx => tx.date >= start && tx.date <= end);
    }

    getTotalByType(type) {
        return this.state.transactions
            .filter(tx => tx.type === type)
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    }

    getAttachmentStats() {
        let count = 0, totalSize = 0;
        this.state.transactions.forEach(tx => {
            if (tx.attachment && tx.attachment.dataUrl) {
                count++;
                // Estimate size from base64 string
                const size = Math.ceil((tx.attachment.dataUrl.length - (tx.attachment.dataUrl.indexOf(',') + 1)) * 3 / 4);
                totalSize += size;
            }
        });
        return { count, totalSize };
    }

    searchTransactions(keyword) {
        const lower = keyword.toLowerCase();
        return this.state.transactions.filter(tx =>
            (tx.description && tx.description.toLowerCase().includes(lower)) ||
            (tx.notes && tx.notes.toLowerCase().includes(lower))
        );
    }

    // --- More Utility & Analytics Functions ---
    getTopCategories(n = 3) {
        const counts = {};
        this.state.transactions.forEach(tx => {
            if (!counts[tx.category]) counts[tx.category] = 0;
            counts[tx.category] += parseFloat(tx.amount);
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([cat, amt]) => ({ category: cat, total: amt }));
    }

    getBiggestExpense() {
        return this.state.transactions
            .filter(tx => tx.type === 'expense')
            .reduce((max, tx) => (!max || parseFloat(tx.amount) > parseFloat(max.amount)) ? tx : max, null);
    }

    getMostFrequentTransaction() {
        const freq = {};
        this.state.transactions.forEach(tx => {
            const key = tx.description + '|' + tx.amount + '|' + tx.category;
            freq[key] = (freq[key] || 0) + 1;
        });
        let maxKey = null, maxCount = 0;
        for (const key in freq) {
            if (freq[key] > maxCount) {
                maxCount = freq[key];
                maxKey = key;
            }
        }
        if (!maxKey) return null;
        const [description, amount, category] = maxKey.split('|');
        return { description, amount, category, count: maxCount };
    }

    getMonthlyTotals() {
        const monthly = {};
        this.state.transactions.forEach(tx => {
            const ym = tx.date.slice(0, 7);
            if (!monthly[ym]) monthly[ym] = 0;
            monthly[ym] += parseFloat(tx.amount) * (tx.type === 'income' ? 1 : -1);
        });
        return monthly;
    }

    // --- Transaction Duplicate Feature ---
    duplicateTransaction(id) {
        const tx = this.state.transactions.find(t => t.id === id);
        if (!tx) return;
        const newTx = { ...tx, id: utils.generateId(), date: new Date().toISOString().slice(0, 10) };
        this.addTransaction(newTx);
    }
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
            // Render the page content if needed
            if (page === 'transactions') renderTransactionsPage();
            if (page === 'budgets') renderBudgetsPage();
            if (page === 'bills') renderBillsPage();
            if (page === 'goals') renderGoalsPage();
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
    const cats = getCategories();
    select.innerHTML = '<option value="">Select category</option>' +
        cats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
                ${tx.tags && tx.tags.length ? `<div class='transaction-tags'>${tx.tags.map(tag => `<span class='tag'>${tag}</span>`).join(' ')}</div>` : ''}
            </div>
            <div class="transaction-meta">
                <div class="transaction-date">${utils.formatDate(tx.date)}</div>
                <div class="transaction-amount ${tx.type}">${utils.formatCurrency(tx.amount)}</div>
                <button class="btn btn-fav" title="Favorite" onclick="toggleFavoriteTransaction('${tx.id}')">
                    <i class="fas fa-star${tx.favorite ? '' : '-o'}" style="color:${tx.favorite ? '#fbbf24' : '#aaa'}"></i>
                </button>
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
    // Recurring UI logic
    const recurringCheckbox = document.getElementById('transaction-recurring');
    const recurringOptions = document.getElementById('recurring-options');
    if (recurringCheckbox && recurringOptions) {
        recurringCheckbox.onchange = function() {
            recurringOptions.style.display = this.checked ? 'inline-block' : 'none';
        };
    }
    form.onsubmit = function(e) {
        e.preventDefault();
        const type = form['type'].value;
        const amount = parseFloat(form['amount'].value);
        const description = form['description'].value;
        const category = form['category'].value;
        const date = form['date'].value;
        const tags = form['tags'] && form['tags'].value ? form['tags'].value.split(',').map(t => t.trim()).filter(Boolean) : [];
        const notes = form['notes'] ? form['notes'].value : '';
        let attachment = null;
        if (form['attachment'] && form['attachment'].files && form['attachment'].files[0]) {
            const file = form['attachment'].files[0];
            if (file.size > 1024 * 1024) {
                NotificationService.showError('Attachment too large (max 1MB).');
                return;
            }
            attachment = {
                name: file.name,
                type: file.type,
                dataUrl: '' // Will be filled by FileReader below
            };
            const reader = new FileReader();
            reader.onload = function(e) {
                attachment.dataUrl = e.target.result;
                submitTx();
            };
            reader.readAsDataURL(file);
            return;
        }
        submitTx();
        function submitTx() {
            const isRecurring = recurringCheckbox && recurringCheckbox.checked;
            if (!type || !amount || !description || !category || !date) return;
            // --- Budget Alert Logic ---
            if (type === 'expense') {
                const budgets = window.app.state.budgets || [];
                const budget = budgets.find(b => b.category === category);
                if (budget) {
                    const txs = window.app.getTransactions().filter(tx => tx.type === 'expense' && tx.category === category && tx.date.slice(0,7) === date.slice(0,7));
                    const spent = txs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) + amount;
                    if (spent > parseFloat(budget.amount)) {
                        NotificationService.showError('Warning: This will exceed your budget for ' + category + '!');
                    } else if (spent > 0.9 * parseFloat(budget.amount)) {
                        NotificationService.showError('Caution: You are close to your budget for ' + category + '.');
                    }
                }
            }
            // --- End Budget Alert Logic ---
            if (isRecurring) {
                const freq = form['recurring-frequency'].value;
                const count = parseInt(form['recurring-count'].value) || 1;
                let d = new Date(date);
                for (let i = 0; i < count; ++i) {
                    window.transactionManager.add({
                        type, amount, description: description + ' (Recurring)', category, date: d.toISOString().slice(0, 10), tags, notes, attachment
                    });
                    if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
                    else if (freq === 'weekly') d.setDate(d.getDate() + 7);
                    else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
                }
            } else {
                window.transactionManager.add({ type, amount, description, category, date, tags, notes, attachment });
            }
            document.getElementById('transaction-modal').style.display = 'none';
            form.reset();
            if (recurringOptions) recurringOptions.style.display = 'none';
            updateDashboardSummary();
            renderRecentTransactions();
        }
    };
}

function getChartFontColor() {
    return getComputedStyle(document.body).getPropertyValue('--text-primary') || '#1e293b';
}
function getChartFontSize() {
    return parseFloat(getComputedStyle(document.body).getPropertyValue('--chart-font-size')) || 16;
}
function getBarLabelColor(ctx) {
    // Use white for dark bars, dark for light bars
    const bg = ctx.dataset.backgroundColor[ctx.dataIndex] || ctx.dataset.backgroundColor;
    // Simple luminance check for RGB(A)
    let rgb = bg.match(/\d+/g);
    if (!rgb) return '#222';
    let [r, g, b] = rgb;
    let luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance < 140 ? '#fff' : '#222';
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
                data: [income, expenses],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.9)', // green
                    'rgba(239, 68, 68, 0.9)'   // red
                ],
                borderRadius: 6,
                maxBarThickness: 60
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: getChartFontColor(), font: { size: 20 } }
                },
                y: {
                    grid: { color: 'rgba(100,116,139,0.12)' },
                    ticks: {
                        color: getChartFontColor(),
                        font: { size: 20 },
                        beginAtZero: true,
                        callback: function(value) {
                            return '$' + Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        }
                    }
                }
            }
        },
        plugins: []
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
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: categories.map((_, i) => i % 2 === 0 ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)'),
                borderRadius: 6,
                maxBarThickness: 60
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                datalabels: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: getChartFontColor(), font: { size: 20 } }
                },
                y: {
                    grid: { color: 'rgba(100,116,139,0.12)' },
                    ticks: {
                        color: getChartFontColor(),
                        font: { size: 20 },
                        beginAtZero: true,
                        callback: function(value) {
                            return '$' + Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                        }
                    }
                }
            }
        },
        plugins: []
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
        <h2>All Transactions <button class='btn btn-secondary' id='show-favorites-btn'><i class='fas fa-star'></i> Favorites</button></h2>
        <div class="transaction-list">
            ${txs.map(tx => {
                const isGoal = tx.description && tx.description.toLowerCase().includes('goal');
                return `
                <div class="transaction-item" data-id="${tx.id}">
                    <div class="transaction-icon ${tx.type}"><i class="fas fa-${tx.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i></div>
                    <div class="transaction-details">
                        <div class="transaction-description">${tx.description}</div>
                        <div class="transaction-category">${tx.category}</div>
                        ${tx.tags && tx.tags.length ? `<div class='transaction-tags'>${tx.tags.map(tag => `<span class='tag'>${tag}</span>`).join(' ')}</div>` : ''}
                    </div>
                    <div class="transaction-meta">
                        <div class="transaction-date">${utils.formatDate(tx.date)}</div>
                        <div class="transaction-amount ${tx.type}">${utils.formatCurrency(tx.amount)}</div>
                        <button class="btn btn-fav" title="Favorite" onclick="toggleFavoriteTransaction('${tx.id}')">
                            <i class="fas fa-star${tx.favorite ? '' : '-o'}" style="color:${tx.favorite ? '#fbbf24' : '#aaa'}"></i>
                        </button>
                    </div>
                    <div class="transaction-actions">
                        ${!isGoal ? `<button class="btn btn-secondary btn-edit-tx" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-delete-tx" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                        <button class="btn btn-secondary btn-duplicate-tx" title="Duplicate"><i class="fas fa-copy"></i></button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
    // Add event listeners for edit/delete
    page.querySelectorAll('.btn-edit-tx').forEach(btn => {
        btn.onclick = function(e) {
            const id = btn.closest('.transaction-item').getAttribute('data-id');
            editTransaction(id);
        };
    });
    page.querySelectorAll('.btn-delete-tx').forEach(btn => {
        btn.onclick = function(e) {
            const id = btn.closest('.transaction-item').getAttribute('data-id');
            if (confirm('Delete this transaction?')) {
                window.app.deleteTransaction(id);
                renderTransactionsPage();
                updateDashboardSummary && updateDashboardSummary();
                renderRecentTransactions && renderRecentTransactions();
            }
        };
    });
    // Add duplicate button event listeners
    document.querySelectorAll('.btn-duplicate-tx').forEach(btn => {
        btn.onclick = function() {
            const id = btn.closest('.transaction-item').getAttribute('data-id');
            window.app.duplicateTransaction(id);
            renderTransactionsPage();
            renderRecentTransactions && renderRecentTransactions();
        };
    });
    // Filter favorites
    const favBtn = document.getElementById('show-favorites-btn');
    if (favBtn) {
        favBtn.onclick = function() {
            const favs = window.app.getTransactions().filter(tx => tx.favorite);
            if (!favs.length) return alert('No favorites yet!');
            page.innerHTML = `<h2>Favorite Transactions</h2><div class='transaction-list'>${favs.map(tx => `
                <div class='transaction-item'>
                    <div class='transaction-icon ${tx.type}'><i class='fas fa-${tx.type === 'income' ? 'arrow-up' : 'arrow-down'}'></i></div>
                    <div class='transaction-details'>
                        <div class='transaction-description'>${tx.description}</div>
                        <div class='transaction-category'>${tx.category}</div>
                        ${tx.tags && tx.tags.length ? `<div class='transaction-tags'>${tx.tags.map(tag => `<span class='tag'>${tag}</span>`).join(' ')}</div>` : ''}
                    </div>
                    <div class='transaction-meta'>
                        <div class='transaction-date'>${utils.formatDate(tx.date)}</div>
                        <div class='transaction-amount ${tx.type}'>${utils.formatCurrency(tx.amount)}</div>
                        <button class='btn btn-fav' title='Favorite' onclick='toggleFavoriteTransaction("${tx.id}")'>
                            <i class='fas fa-star' style='color:#fbbf24'></i>
                        </button>
                    </div>
                </div>
            `).join('')}</div><button class='btn' onclick='renderTransactionsPage()'>Back</button>`;
        };
    }
}

function editTransaction(id) {
    const tx = window.app.getTransactions().find(t => t.id === id);
    if (!tx) return;
    // Show modal and prefill
    document.getElementById('transaction-modal').style.display = 'flex';
    document.getElementById('transaction-modal-title').textContent = 'Edit Transaction';
    document.getElementById('transaction-type').value = tx.type;
    document.getElementById('transaction-amount').value = tx.amount;
    document.getElementById('transaction-description').value = tx.description;
    document.getElementById('transaction-category').value = tx.category;
    document.getElementById('transaction-date').value = tx.date;
    document.getElementById('transaction-tags').value = (tx.tags || []).join(', ');
    document.getElementById('transaction-notes').value = tx.notes || '';
    window._editTxId = id;
    // Patch form submit
    const form = document.getElementById('transaction-form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            const data = {
                type: form.type.value,
                amount: parseFloat(form.amount.value),
                description: form.description.value,
                category: form.category.value,
                date: form.date.value,
                tags: form['tags'] && form['tags'].value ? form['tags'].value.split(',').map(t => t.trim()).filter(Boolean) : [],
                notes: form['notes'] ? form['notes'].value : ''
            };
            window.app.updateTransaction(window._editTxId, data);
            document.getElementById('transaction-modal').style.display = 'none';
            renderTransactionsPage();
            updateDashboardSummary && updateDashboardSummary();
            renderRecentTransactions && renderRecentTransactions();
            window._editTxId = null;
            // Restore default form handler
            handleTransactionForm && handleTransactionForm();
        };
    }
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
    // Card container
    let bills = Storage.getBills();
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
        const bills = Storage.getBills();
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
// --- END BUDGET FUNCTIONALITY ---

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
    // Date range form
    const rangeForm = document.getElementById('download-range-form');
    const allBtn = document.getElementById('download-all-btn');
    if (rangeForm) {
        rangeForm.onsubmit = function(e) {
            e.preventDefault();
            const start = document.getElementById('download-start-date').value;
            const end = document.getElementById('download-end-date').value;
            if (!start || !end) return NotificationService.showError('Please select both dates.');
            const txs = window.app.getTransactions().filter(tx => {
                return tx.date >= start && tx.date <= end;
            });
            if (!txs.length) return NotificationService.showError('No transactions in selected range.');
            const csv = transactionsToCSV(txs);
            downloadCSV(csv, `transactions_${start}_to_${end}.csv`);
        };
    }
    if (allBtn) {
        allBtn.onclick = function() {
            const txs = window.app.getTransactions();
            if (!txs.length) return NotificationService.showError('No transactions to export.');
            const csv = transactionsToCSV(txs);
            downloadCSV(csv, 'transactions_all.csv');
        };
    }
    // Upload logic
    const uploadInput = document.getElementById('upload-file');
    const uploadForm = document.getElementById('upload-form');
    const uploadFilename = document.getElementById('upload-filename');
    if (uploadInput && uploadForm) {
        uploadInput.onchange = function() {
            if (uploadInput.files.length) {
                uploadFilename.textContent = uploadInput.files[0].name;
                handleFileUpload(uploadInput.files[0]);
            } else {
                uploadFilename.textContent = '';
            }
        };
        uploadForm.onsubmit = function(e) { e.preventDefault(); };
    }
}

function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        let imported = false;
        if (file.name.endsWith('.csv')) {
            imported = importTransactionsFromCSV(text);
        } else if (file.name.endsWith('.txt')) {
            imported = importTransactionsFromText(text);
        }
        if (imported) {
            NotificationService.showSuccess('Data imported! Refreshing...');
            setTimeout(() => window.location.reload(), 800);
        } else {
            NotificationService.showError('Could not import data. Check file format.');
        }
    };
    reader.readAsText(file);
}

function importTransactionsFromCSV(text) {
    // Accepts: ID,Type,Amount,Description,Category,Date (header row optional)
    const lines = text.trim().split(/\r?\n/);
    let start = 0;
    if (/id|type|amount|description|category|date/i.test(lines[0])) start = 1;
    const txs = Storage.getTransactions();
    let imported = 0;
    for (let i = start; i < lines.length; ++i) {
        const row = lines[i].split(',');
        if (row.length < 6) continue;
        const [id, type, amount, description, category, date] = row;
        if (!type || !amount || !date) continue;
        txs.push({
            id: id || utils.generateId(),
            type: type.trim(),
            amount: parseFloat(amount),
            description: description.replace(/^"|"$/g, ''),
            category: category.trim(),
            date: date.trim()
        });
        imported++;
    }
    if (imported) Storage.saveTransactions(txs);
    return imported > 0;
}

function importTransactionsFromText(text) {
    // Accepts lines like: type,amount,description,category,date
    const lines = text.trim().split(/\r?\n/);
    const txs = Storage.getTransactions();
    let imported = 0;
    for (let line of lines) {
        const row = line.split(',');
        if (row.length < 5) continue;
        const [type, amount, description, category, date] = row;
        if (!type || !amount || !date) continue;
        txs.push({
            id: utils.generateId(),
            type: type.trim(),
            amount: parseFloat(amount),
            description: description.replace(/^"|"$/g, ''),
            category: category.trim(),
            date: date.trim()
        });
        imported++;
    }
    if (imported) Storage.saveTransactions(txs);
    return imported > 0;
}
// --- END REPORTS PAGE FUNCTIONALITY ---

// --- BEGIN EXPORT/IMPORT FOR BUDGETS, BILLS, GOALS ---
function setupReportsDataImportExport() {
    // Budgets
    document.getElementById('download-budgets-btn')?.addEventListener('click', () => {
        const arr = Storage.getBudgets();
        if (!arr.length) return NotificationService.showError('No budgets to export.');
        const csv = [['Category','Amount','Period'].join(',')].concat(arr.map(b => [b.category,b.amount,b.period].join(','))).join('\r\n');
        downloadCSV(csv, 'budgets.csv');
    });
    document.getElementById('upload-budgets')?.addEventListener('change', function() {
        if (!this.files.length) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.trim().split(/\r?\n/);
            let start = 0;
            if (/category|amount|period/i.test(lines[0])) start = 1;
            const arr = [];
            for (let i = start; i < lines.length; ++i) {
                const [category, amount, period] = lines[i].split(',');
                if (category && amount && period) arr.push({category, amount, period});
            }
            if (arr.length) Storage.saveBudgets(arr);
            NotificationService.showSuccess('Budgets imported!');
            setTimeout(()=>window.location.reload(), 800);
        };
        reader.readAsText(this.files[0]);
    });
    // Bills
    document.getElementById('download-bills-btn')?.addEventListener('click', () => {
        const arr = Storage.getBills();
        if (!arr.length) return NotificationService.showError('No bills to export.');
        const csv = [['Name','Amount','DueDate','Status'].join(',')].concat(arr.map(b => [b.name,b.amount,b.dueDate,b.status].join(','))).join('\r\n');
        downloadCSV(csv, 'bills.csv');
    });
    document.getElementById('upload-bills')?.addEventListener('change', function() {
        if (!this.files.length) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.trim().split(/\r?\n/);
            let start = 0;
            if (/name|amount|due/i.test(lines[0])) start = 1;
            const arr = [];
            for (let i = start; i < lines.length; ++i) {
                const [name, amount, dueDate, status] = lines[i].split(',');
                if (name && amount && dueDate) arr.push({name, amount, dueDate, status: status||'pending'});
            }
            if (arr.length) Storage.saveBills(arr);
            NotificationService.showSuccess('Bills imported!');
            setTimeout(()=>window.location.reload(), 800);
        };
        reader.readAsText(this.files[0]);
    });
    // Goals
    document.getElementById('download-goals-btn')?.addEventListener('click', () => {
        const arr = Storage.getGoals();
        if (!arr.length) return NotificationService.showError('No goals to export.');
        const csv = [['Name','Amount','Date','Desc','Saved','Status'].join(',')].concat(arr.map(g => [g.name,g.amount,g.date,g.desc||'',g.saved||0,g.status||''].join(','))).join('\r\n');
        downloadCSV(csv, 'goals.csv');
    });
    document.getElementById('upload-goals')?.addEventListener('change', function() {
        if (!this.files.length) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.trim().split(/\r?\n/);
            let start = 0;
            if (/name|amount|date/i.test(lines[0])) start = 1;
            const arr = [];
            for (let i = start; i < lines.length; ++i) {
                const [name, amount, date, desc, saved, status] = lines[i].split(',');
                if (name && amount && date) arr.push({name, amount, date, desc, saved: parseFloat(saved)||0, status: status||''});
            }
            if (arr.length) Storage.saveGoals(arr);
            NotificationService.showSuccess('Goals imported!');
            setTimeout(()=>window.location.reload(), 800);
        };
        reader.readAsText(this.files[0]);
    });
}
document.addEventListener('DOMContentLoaded', setupReportsDataImportExport);
// --- END EXPORT/IMPORT FOR BUDGETS, BILLS, GOALS ---

// --- BEGIN DARK MODE TOGGLE FUNCTIONALITY ---
    // Theme toggle (dark mode)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Set initial theme from localStorage or system preference
        const root = document.documentElement;
        function setTheme(theme) {
            root.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            // Optionally update icon
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(currentTheme);
        // Toggle on click
        themeToggle.addEventListener('click', () => {
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
// --- END DARK MODE TOGGLE FUNCTIONALITY ---
// --- FAVORITE/STARRED TRANSACTIONS ---
// Add a favorite property to transactions and UI controls
function toggleFavoriteTransaction(id) {
    const txs = window.app.getTransactions();
    const idx = txs.findIndex(t => t.id === id);
    if (idx !== -1) {
        txs[idx].favorite = !txs[idx].favorite;
        Storage.saveTransactions(txs);
        renderTransactionsPage && renderTransactionsPage();
        renderRecentTransactions && renderRecentTransactions();
    }
}
window.toggleFavoriteTransaction = toggleFavoriteTransaction;

// Patch renderRecentTransactions to show star icon
const origRenderRecentTransactions = renderRecentTransactions;
renderRecentTransactions = function() {
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
                ${tx.tags && tx.tags.length ? `<div class='transaction-tags'>${tx.tags.map(tag => `<span class='tag'>${tag}</span>`).join(' ')}</div>` : ''}
            </div>
            <div class="transaction-meta">
                <div class="transaction-date">${utils.formatDate(tx.date)}</div>
                <div class="transaction-amount ${tx.type}">${utils.formatCurrency(tx.amount)}</div>
                <button class="btn btn-fav" title="Favorite" onclick="toggleFavoriteTransaction('${tx.id}')">
                    <i class="fas fa-star${tx.favorite ? '' : '-o'}" style="color:${tx.favorite ? '#fbbf24' : '#aaa'}"></i>
                </button>
            </div>
        </div>
    `).join('');
};

// Patch renderTransactionsPage to show star icon and filter
const origRenderTransactionsPage = renderTransactionsPage;
renderTransactionsPage = function() {
    const page = document.getElementById('transactions-page');
    if (!page) return;
    const txs = window.app.getTransactions();
    if (txs.length === 0) {
        page.innerHTML = '<div class="empty-state"><p>No transactions found.</p></div>';
        return;
    }
    page.innerHTML = `
        <h2>All Transactions <button class='btn btn-secondary' id='show-favorites-btn'><i class='fas fa-star'></i> Favorites</button></h2>
        <div class="transaction-list">
            ${txs.map(tx => {
                const isGoal = tx.description && tx.description.toLowerCase().includes('goal');
                return `
                <div class="transaction-item" data-id="${tx.id}">
                    <div class="transaction-icon ${tx.type}"><i class="fas fa-${tx.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i></div>
                    <div class="transaction-details">
                        <div class="transaction-description">${tx.description}</div>
                        <div class="transaction-category">${tx.category}</div>
                        ${tx.tags && tx.tags.length ? `<div class='transaction-tags'>${tx.tags.map(tag => `<span class='tag'>${tag}</span>`).join(' ')}</div>` : ''}
                    </div>
                    <div class="transaction-meta">
                        <div class="transaction-date">${utils.formatDate(tx.date)}</div>
                        <div class="transaction-amount ${tx.type}">${utils.formatCurrency(tx.amount)}</div>
                        <button class="btn btn-fav" title="Favorite" onclick="toggleFavoriteTransaction('${tx.id}')">
                            <i class="fas fa-star${tx.favorite ? '' : '-o'}" style="color:${tx.favorite ? '#fbbf24' : '#aaa'}"></i>
                        </button>
                    </div>
                    <div class="transaction-actions">
                        ${!isGoal ? `<button class="btn btn-secondary btn-edit-tx" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-delete-tx" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                        <button class="btn btn-secondary btn-duplicate-tx" title="Duplicate"><i class="fas fa-copy"></i></button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
    // Add event listeners for edit/delete
    page.querySelectorAll('.btn-edit-tx').forEach(btn => {
        btn.onclick = function(e) {
            const id = btn.closest('.transaction-item').getAttribute('data-id');
            editTransaction(id);
        };
    });
    page.querySelectorAll('.btn-delete-tx').forEach(btn => {
        btn.onclick = function(e) {
            const id = btn.closest('.transaction-item').getAttribute('data-id');
            if (confirm('Delete this transaction?')) {
                window.app.deleteTransaction(id);
                renderTransactionsPage();
                updateDashboardSummary && updateDashboardSummary();
                renderRecentTransactions && renderRecentTransactions();
            }
        };
    });
    // Add duplicate button event listeners
    document.querySelectorAll('.btn-duplicate-tx').forEach(btn => {
        btn.onclick = function() {
            const id = btn.closest('.transaction-item').getAttribute('data-id');
            window.app.duplicateTransaction(id);
            renderTransactionsPage();
            renderRecentTransactions && renderRecentTransactions();
        };
    });
    // Filter favorites
    const favBtn = document.getElementById('show-favorites-btn');
    if (favBtn) {
        favBtn.onclick = function() {
            const favs = window.app.getTransactions().filter(tx => tx.favorite);
            if (!favs.length) return alert('No favorites yet!');
            page.innerHTML = `<h2>Favorite Transactions</h2><div class='transaction-list'>${favs.map(tx => `
                <div class='transaction-item'>
                    <div class='transaction-icon ${tx.type}'><i class='fas fa-${tx.type === 'income' ? 'arrow-up' : 'arrow-down'}'></i></div>
                    <div class='transaction-details'>
                        <div class='transaction-description'>${tx.description}</div>
                        <div class='transaction-category'>${tx.category}</div>
                        ${tx.tags && tx.tags.length ? `<div class='transaction-tags'>${tx.tags.map(tag => `<span class='tag'>${tag}</span>`).join(' ')}</div>` : ''}
                    </div>
                    <div class='transaction-meta'>
                        <div class='transaction-date'>${utils.formatDate(tx.date)}</div>
                        <div class='transaction-amount ${tx.type}'>${utils.formatCurrency(tx.amount)}</div>
                        <button class='btn btn-fav' title='Favorite' onclick='toggleFavoriteTransaction("${tx.id}")'>
                            <i class='fas fa-star' style='color:#fbbf24'></i>
                        </button>
                    </div>
                </div>
            `).join('')}</div><button class='btn' onclick='renderTransactionsPage()'>Back</button>`;
        };
    }
};
// --- END SUBTAB RENDERING ---

// --- DASHBOARD ANALYTICS PANEL ---
function renderDashboardAnalytics() {
    const panel = document.getElementById('dashboard-analytics-panel');
    if (!panel) return;
    const topCats = window.app.getTopCategories();
    const biggest = window.app.getBiggestExpense();
    const frequent = window.app.getMostFrequentTransaction();
    panel.innerHTML = `
        <h3>Quick Analytics</h3>
        <div><b>Top Categories:</b> ${topCats.map(c => `${c.category} ($${c.total.toFixed(2)})`).join(', ')}</div>
        <div><b>Biggest Expense:</b> ${biggest ? `${biggest.description} ($${parseFloat(biggest.amount).toFixed(2)})` : 'N/A'}</div>
        <div><b>Most Frequent:</b> ${frequent ? `${frequent.description} (${frequent.count}×)` : 'N/A'}</div>
    `;
}
document.addEventListener('DOMContentLoaded', () => {
    // Add analytics panel to dashboard
    const dash = document.getElementById('dashboard-page');
    if (dash && !document.getElementById('dashboard-analytics-panel')) {
        const panel = document.createElement('div');
        panel.id = 'dashboard-analytics-panel';
        panel.className = 'dashboard-analytics-panel';
        dash.appendChild(panel);
    }
    renderDashboardAnalytics();
});
// Re-render analytics after transaction changes
const origAddTx = window.app.addTransaction.bind(window.app);
window.app.addTransaction = function(tx) {
    origAddTx(tx);
    renderDashboardAnalytics && renderDashboardAnalytics();
};
const origDeleteTx = window.app.deleteTransaction.bind(window.app);
window.app.deleteTransaction = function(id) {
    origDeleteTx(id);
    renderDashboardAnalytics && renderDashboardAnalytics();
};
// --- END DASHBOARD ANALYTICS PANEL ---
