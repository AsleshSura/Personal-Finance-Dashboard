// Dashboard Page Management
class DashboardPage {
    constructor() {
        this.charts = {};
        this.data = {
            summary: null,
            transactions: [],
            bills: [],
            budgets: [],
            goals: []
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Quick action buttons
        document.getElementById('quick-add-income')?.addEventListener('click', () => {
            this.showQuickTransactionModal('income');
        });

        document.getElementById('quick-add-expense')?.addEventListener('click', () => {
            this.showQuickTransactionModal('expense');
        });

        document.getElementById('quick-add-bill')?.addEventListener('click', () => {
            app.navigateTo('bills');
        });

        document.getElementById('quick-add-goal')?.addEventListener('click', () => {
            app.navigateTo('goals');
        });

        // View all links
        document.querySelector('.view-all[data-page="transactions"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            app.navigateTo('transactions');
        });
    }

    async load() {
        try {
            app.showLoading();
            
            // Load all dashboard data in parallel
            await Promise.all([
                this.loadSummaryData(),
                this.loadRecentTransactions(),
                this.loadUpcomingBills(),
                this.loadCurrentBudget()
            ]);

            // Update UI
            this.updateSummaryCards();
            this.updateRecentTransactions();
            this.updateCharts();

        } catch (error) {
            console.error('Dashboard load error:', error);
            app.notifications.error('Failed to load dashboard data');
        } finally {
            app.hideLoading();
        }
    }

    async loadSummaryData() {
        try {
            // Get current month data
            const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const endDate = new Date();
            
            const response = await app.api.get(`/transactions/summary/overview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            
            if (response.success) {
                this.data.summary = response.data;
            }
        } catch (error) {
            console.error('Error loading summary data:', error);
        }
    }

    async loadRecentTransactions() {
        try {
            const response = await app.api.get('/transactions?limit=5&sortBy=date&sortOrder=desc');
            
            if (response.success) {
                this.data.transactions = response.data.transactions;
            }
        } catch (error) {
            console.error('Error loading recent transactions:', error);
        }
    }

    async loadUpcomingBills() {
        try {
            const response = await app.api.get('/bills/upcoming?days=7');
            
            if (response.success) {
                this.data.bills = response.data;
            }
        } catch (error) {
            console.error('Error loading upcoming bills:', error);
        }
    }

    async loadCurrentBudget() {
        try {
            const response = await app.api.get('/budgets/current');
            
            if (response.success && response.data) {
                this.data.budget = response.data;
            }
        } catch (error) {
            console.error('Error loading current budget:', error);
        }
    }

    updateSummaryCards() {
        const summary = this.data.summary;
        const bills = this.data.bills;

        if (summary) {
            // Total Balance (Income - Expenses)
            const balance = summary.totalIncome - summary.totalExpense;
            document.getElementById('total-balance').textContent = utils.formatCurrency(balance);
            
            const balanceChange = document.getElementById('balance-change');
            balanceChange.textContent = balance >= 0 ? `+${utils.formatCurrency(balance)}` : utils.formatCurrency(balance);
            balanceChange.className = `card-change ${balance >= 0 ? 'positive' : 'negative'}`;

            // Monthly Income
            document.getElementById('monthly-income').textContent = utils.formatCurrency(summary.totalIncome);
            
            // Monthly Expenses
            document.getElementById('monthly-expenses').textContent = utils.formatCurrency(summary.totalExpense);
        }

        // Upcoming Bills
        document.getElementById('upcoming-bills').textContent = bills.length;
        const billsAmount = bills.reduce((total, bill) => total + bill.amount, 0);
        document.getElementById('bills-amount').textContent = utils.formatCurrency(billsAmount);
    }

    updateRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        
        if (!this.data.transactions || this.data.transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-receipt" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No recent transactions</p>
                    <button class="btn btn-primary" style="margin-top: 1rem;" onclick="app.showTransactionModal()">
                        Add Your First Transaction
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas ${transaction.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">${utils.capitalize(transaction.category.replace('-', ' '))}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${utils.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');
    }

    updateCharts() {
        this.updateCategoryChart();
        this.updateIncomeExpenseChart();
    }

    updateCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx || !this.data.summary) return;

        // Destroy existing chart
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const categoryData = this.data.summary.categoryBreakdown || [];
        const expenseCategories = categoryData.filter(cat => cat._id.type === 'expense');

        if (expenseCategories.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            const container = ctx.parentElement;
            container.innerHTML = `
                <h3>Spending by Category</h3>
                <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-muted);">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-pie" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No expense data available</p>
                    </div>
                </div>
            `;
            return;
        }

        // Create chart
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: expenseCategories.map(cat => utils.capitalize(cat._id.category.replace('-', ' '))),
                datasets: [{
                    data: expenseCategories.map(cat => cat.total),
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    updateIncomeExpenseChart() {
        const ctx = document.getElementById('income-expense-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.incomeExpense) {
            this.charts.incomeExpense.destroy();
        }

        // Get last 6 months data
        const months = [];
        const incomeData = [];
        const expenseData = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleDateString('en-US', { month: 'short' }));
            incomeData.push(Math.random() * 5000 + 2000); // Mock data
            expenseData.push(Math.random() * 4000 + 1500); // Mock data
        }

        this.charts.incomeExpense = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    showQuickTransactionModal(type = 'expense') {
        const modal = this.createQuickTransactionModal(type);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    createQuickTransactionModal(type) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'quick-transaction-modal';
        
        const categories = {
            income: ['salary', 'freelance', 'business', 'investment', 'rental', 'bonus', 'gift', 'other-income'],
            expense: ['food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment', 'shopping', 'education', 'other-expense']
        };

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Add ${utils.capitalize(type)}</h2>
                    <button class="btn-icon modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="quick-transaction-form">
                        <input type="hidden" id="transaction-type" value="${type}">
                        <div class="form-group">
                            <label for="transaction-amount">Amount</label>
                            <input type="number" id="transaction-amount" step="0.01" min="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="transaction-description">Description</label>
                            <input type="text" id="transaction-description" required>
                        </div>
                        <div class="form-group">
                            <label for="transaction-category">Category</label>
                            <select id="transaction-category" required>
                                <option value="">Select category</option>
                                ${categories[type].map(cat => 
                                    `<option value="${cat}">${utils.capitalize(cat.replace('-', ' '))}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="transaction-date">Date</label>
                            <input type="date" id="transaction-date" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                            <button type="submit" class="btn btn-primary">Add ${utils.capitalize(type)}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

        modal.querySelector('#quick-transaction-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleQuickTransaction(modal);
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    async handleQuickTransaction(modal) {
        const form = modal.querySelector('#quick-transaction-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding...';

            const formData = {
                type: document.getElementById('transaction-type').value,
                amount: parseFloat(document.getElementById('transaction-amount').value),
                description: document.getElementById('transaction-description').value.trim(),
                category: document.getElementById('transaction-category').value,
                date: document.getElementById('transaction-date').value,
                paymentMethod: 'cash'
            };

            const response = await app.api.post('/transactions', formData);

            if (response.success) {
                app.notifications.success(`${utils.capitalize(formData.type)} added successfully`);
                modal.remove();
                
                // Refresh dashboard data
                await this.load();
            } else {
                throw new Error(response.message || 'Failed to add transaction');
            }

        } catch (error) {
            console.error('Quick transaction error:', error);
            app.notifications.error(error.message || 'Failed to add transaction');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    // Refresh dashboard data
    async refresh() {
        await this.load();
    }
}

// Initialize dashboard page
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardPage = new DashboardPage();
});