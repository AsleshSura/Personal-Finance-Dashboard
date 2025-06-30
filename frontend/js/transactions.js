// Transaction Management
class TransactionManager {
    constructor() {
        this.api = window.app?.api || this.createSimpleApiService();
        this.notifications = window.app?.notifications || this.createSimpleNotificationService();
        this.modal = null;
        this.currentTransaction = null;
        this.transactions = [];
        this.currentFilters = {
            type: '',
            search: ''
        };
        
        this.init();
    }

    createSimpleApiService() {
        const baseURL = 'http://localhost:5001/api';
        return {
            async request(endpoint, options = {}) {
                const url = `${baseURL}${endpoint}`;
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                };

                const response = await fetch(url, config);
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                }
                return await response.json();
            },

            async get(endpoint) {
                return this.request(endpoint);
            },

            async post(endpoint, data) {
                return this.request(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },

            async put(endpoint, data) {
                return this.request(endpoint, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
            },

            async delete(endpoint) {
                return this.request(endpoint, {
                    method: 'DELETE'
                });
            }
        };
    }

    createSimpleNotificationService() {
        return {
            success(message) {
                console.log('✅ Success:', message);
                this.showNotification(message, 'success');
            },
            error(message) {
                console.error('❌ Error:', message);
                this.showNotification(message, 'error');
            },
            showNotification(message, type) {
                // Simple notification - could be enhanced later
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.textContent = message;
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 4px;
                    color: white;
                    z-index: 10000;
                    background: ${type === 'success' ? '#10b981' : '#ef4444'};
                `;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }
        };
    }

    init() {
        this.setupModal();
        this.setupEventListeners();
        this.loadTransactions();
    }

    setupModal() {
        this.modal = document.getElementById('transaction-modal');
        this.form = document.getElementById('transaction-form');
        this.typeSelect = document.getElementById('transaction-type');
        this.categorySelect = document.getElementById('transaction-category');
        
        // Debug logging
        console.log('Modal elements found:', {
            modal: !!this.modal,
            form: !!this.form,
            typeSelect: !!this.typeSelect,
            categorySelect: !!this.categorySelect
        });
        
        // Set default date to today
        const dateInput = document.getElementById('transaction-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    setupEventListeners() {
        // Modal controls
        const addBtn = document.getElementById('add-transaction-btn');
        const cancelBtn = document.getElementById('cancel-transaction');

        if (addBtn) {
            addBtn.addEventListener('click', () => this.showModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal());
        }

        // Click outside modal to close
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // Type change handler for category filtering
        this.typeSelect?.addEventListener('change', () => {
            this.updateCategoryOptions();
        });

        // Form submission
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submit event triggered');
            this.handleSubmit();
        });

        // Also add direct button click handler as backup
        const submitBtn = document.getElementById('save-transaction');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Submit button clicked directly');
                this.handleSubmit();
            });
        } else {
            console.warn('Submit button not found');
        }
    }

    showModal(transaction = null) {
        if (!this.modal) return;

        this.currentTransaction = transaction;
        const title = document.getElementById('transaction-modal-title');
        
        if (transaction) {
            title.textContent = 'Edit Transaction';
            this.populateForm(transaction);
        } else {
            title.textContent = 'Add Transaction';
            this.resetForm();
        }

        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Re-attach event listeners to make sure they work
        this.attachModalEventListeners();
    }

    attachModalEventListeners() {
        // Remove any existing listeners first
        const submitBtn = document.getElementById('save-transaction');
        if (submitBtn) {
            const newSubmitBtn = submitBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
            
            newSubmitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Submit button clicked!');
                this.handleSubmit();
            });
        }

        // Re-attach form listener
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submitted!');
                this.handleSubmit();
            });
        }
    }

    hideModal() {
        if (!this.modal) return;
        
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetForm();
        this.currentTransaction = null;
    }

    resetForm() {
        if (!this.form) return;
        
        this.form.reset();
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        this.updateCategoryOptions();
    }

    populateForm(transaction) {
        if (!transaction) return;

        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-date').value = transaction.date;
        
        this.updateCategoryOptions();
        document.getElementById('transaction-category').value = transaction.category;
    }

    updateCategoryOptions() {
        const type = this.typeSelect?.value;
        const categorySelect = document.getElementById('transaction-category');
        
        if (!categorySelect) return;

        // Clear existing options (except the first "Select category" option)
        categorySelect.innerHTML = '<option value="">Select category</option>';

        if (!type) {
            return;
        }

        const categories = {
            income: [
                { value: 'salary', label: 'Salary' },
                { value: 'freelance', label: 'Freelance' },
                { value: 'investment', label: 'Investment' },
                { value: 'gift', label: 'Gift' },
                { value: 'other-income', label: 'Other Income' }
            ],
            expense: [
                { value: 'food', label: 'Food & Dining' },
                { value: 'transportation', label: 'Transportation' },
                { value: 'housing', label: 'Housing' },
                { value: 'utilities', label: 'Utilities' },
                { value: 'entertainment', label: 'Entertainment' },
                { value: 'healthcare', label: 'Healthcare' },
                { value: 'shopping', label: 'Shopping' },
                { value: 'education', label: 'Education' },
                { value: 'other-expense', label: 'Other Expense' }
            ]
        };

        const typeCategories = categories[type] || [];
        typeCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.label;
            categorySelect.appendChild(option);
        });
    }

    async handleSubmit() {
        console.log('handleSubmit called');
        
        if (!this.form) {
            console.error('Form not found!');
            this.notifications.error('Form not available');
            return;
        }

        const formData = new FormData(this.form);
        const data = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            category: formData.get('category'),
            date: formData.get('date')
        };

        console.log('Form data:', data);

        // Validate required fields
        if (!data.type || !data.amount || !data.description || !data.category || !data.date) {
            console.error('Missing required fields:', data);
            this.notifications.error('Please fill in all required fields');
            return;
        }

        try {
            if (this.currentTransaction) {
                await this.updateTransaction(this.currentTransaction.id, data);
            } else {
                await this.createTransaction(data);
            }
            
            this.hideModal();
            this.loadTransactions();
            this.refreshDashboard();
            
        } catch (error) {
            console.error('Error saving transaction:', error);
            this.notifications.error('Failed to save transaction');
        }
    }

    refreshDashboard() {
        // Refresh dashboard data if we're on the dashboard page
        if (window.app?.state?.currentPage === 'dashboard' && window.dashboardPage) {
            window.dashboardPage.load();
        }
    }

    async createTransaction(data) {
        const response = await this.api.post('/transactions', data);
        this.notifications.success('Transaction added successfully');
        return response;
    }

    async updateTransaction(id, data) {
        const response = await this.api.put(`/transactions/${id}`, data);
        this.notifications.success('Transaction updated successfully');
        return response;
    }

    async deleteTransaction(id) {
        try {
            await this.api.delete(`/transactions/${id}`);
            this.notifications.success('Transaction deleted successfully');
            this.loadTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            this.notifications.error('Failed to delete transaction');
        }
    }

    async loadTransactions(page = 1, limit = 10, filters = {}) {
        try {
            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            // Add filters if they exist
            if (filters.type) params.append('type', filters.type);
            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await this.api.get(`/transactions?${params.toString()}`);
            this.transactions = response.transactions || [];
            this.renderRecentTransactions();
            
            // If we're on the transactions page, render full list
            if (window.app?.state?.currentPage === 'transactions') {
                this.renderTransactionsPage(response);
            }
            
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.notifications.error('Failed to load transactions');
        }
    }

    renderRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        if (this.transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions yet</p>
                    <button onclick="window.transactionManager.showModal()" class="btn btn-primary btn-sm">
                        Add Your First Transaction
                    </button>
                </div>
            `;
            return;
        }

        const recentTransactions = this.transactions.slice(0, 5);
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas ${this.getCategoryIcon(transaction.category)}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">${this.formatCategory(transaction.category)}</div>
                    <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    renderTransactionsPage(data) {
        const page = document.getElementById('transactions-page');
        if (!page) return;

        page.innerHTML = `
            <div class="page-header">
                <h2>Transactions</h2>
                <button onclick="window.transactionManager.showModal()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Transaction
                </button>
            </div>
            
            <div class="transactions-filters">
                <div class="filter-group">
                    <select id="type-filter">
                        <option value="">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div class="filter-group">
                    <input type="text" id="search-filter" placeholder="Search transactions...">
                </div>
            </div>
            
            <div class="transactions-list">
                ${this.transactions.map(transaction => `
                    <div class="transaction-card">
                        <div class="transaction-main">
                            <div class="transaction-icon ${transaction.type}">
                                <i class="fas ${this.getCategoryIcon(transaction.category)}"></i>
                            </div>
                            <div class="transaction-info">
                                <div class="transaction-description">${transaction.description}</div>
                                <div class="transaction-meta">
                                    <span class="transaction-category">${this.formatCategory(transaction.category)}</span>
                                    <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                                </div>
                            </div>
                            <div class="transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                            </div>
                        </div>
                        <div class="transaction-actions">
                            <button onclick="window.transactionManager.showModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})" 
                                    class="btn btn-sm btn-secondary">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="window.transactionManager.deleteTransaction('${transaction.id}')" 
                                    class="btn btn-sm btn-danger">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${data.pagination ? `
                <div class="pagination">
                    <button ${data.pagination.page <= 1 ? 'disabled' : ''} 
                            onclick="window.transactionManager.loadTransactions(${data.pagination.page - 1})">
                        Previous
                    </button>
                    <span>Page ${data.pagination.page} of ${data.pagination.totalPages}</span>
                    <button ${data.pagination.page >= data.pagination.totalPages ? 'disabled' : ''} 
                            onclick="window.transactionManager.loadTransactions(${data.pagination.page + 1})">
                        Next
                    </button>
                </div>
            ` : ''}
        `;
        
        // Set up filter event listeners after rendering
        this.setupFilterListeners();
    }

    setupFilterListeners() {
        const typeFilter = document.getElementById('type-filter');
        const searchFilter = document.getElementById('search-filter');

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilters = { ...this.currentFilters, type: e.target.value };
                this.loadTransactions(1, 20, this.currentFilters);
            });
        }

        if (searchFilter) {
            let searchTimeout;
            searchFilter.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters = { ...this.currentFilters, search: e.target.value };
                    this.loadTransactions(1, 20, this.currentFilters);
                }, 300); // Debounce search
            });
        }
    }

    getCategoryIcon(category) {
        const icons = {
            salary: 'fa-money-bill-wave',
            freelance: 'fa-laptop',
            investment: 'fa-chart-line',
            gift: 'fa-gift',
            food: 'fa-utensils',
            transportation: 'fa-car',
            housing: 'fa-home',
            utilities: 'fa-bolt',
            entertainment: 'fa-film',
            healthcare: 'fa-heartbeat',
            shopping: 'fa-shopping-bag',
            education: 'fa-graduation-cap'
        };
        return icons[category] || 'fa-receipt';
    }

    formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Method to get analytics data
    async getAnalytics(period = 'month') {
        try {
            const response = await this.api.get(`/transactions/analytics/summary?period=${period}`);
            return response;
        } catch (error) {
            console.error('Error loading analytics:', error);
            return null;
        }
    }
}

// Initialize transaction manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.transactionManager = new TransactionManager();
});

// Make it available globally for other scripts
window.TransactionManager = TransactionManager;
