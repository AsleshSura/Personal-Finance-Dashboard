// Global App Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    TOKEN_KEY: 'finance_dashboard_token',
    USER_KEY: 'finance_dashboard_user'
};

// App State Management
class AppState {
    constructor() {
        this.user = null;
        this.token = null;
        this.currentPage = 'dashboard';
        this.theme = localStorage.getItem('theme') || 'light';
        this.loadFromStorage();
    }

    loadFromStorage() {
        this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
        const userData = localStorage.getItem(CONFIG.USER_KEY);
        if (userData) {
            this.user = JSON.parse(userData);
        }
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    }

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    isAuthenticated() {
        return !!(this.token && this.user);
    }
}

// API Service
class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (app.state.token) {
            config.headers.Authorization = `Bearer ${app.state.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(errorData.error || errorData.message || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    async uploadFile(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set content-type for FormData
        });
    }
}

// Notification System
class NotificationService {
    constructor() {
        this.container = document.getElementById('notifications');
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        this.container.appendChild(notification);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }

        return notification;
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Utility Functions
const utils = {
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString();
        } else if (format === 'long') {
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (format === 'relative') {
            const now = new Date();
            const diffTime = Math.abs(now - d);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return d.toLocaleDateString();
        }
        return d.toLocaleDateString();
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Main Application Class
class FinanceApp {
    constructor() {
        this.state = new AppState();
        this.api = new ApiService();
        this.notifications = new NotificationService();
        this.pages = {};
        this.modals = {};
        
        this.init();
    }

    async init() {
        // Set initial theme
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Check authentication
        if (this.state.isAuthenticated()) {
            try {
                // Verify token is still valid
                await this.api.get('/auth/me');
                this.showApp();
            } catch (error) {
                console.error('Token validation failed:', error);
                this.state.clearAuth();
                this.showAuth();
            }
        } else {
            this.showAuth();
        }

        this.setupEventListeners();
        this.hideLoading();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
            this.state.setTheme(newTheme);
            this.updateThemeIcon();
        });

        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Quick actions
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Global error handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.notifications.error('An unexpected error occurred');
        });
    }

    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-screen').style.display = 'none';
    }

    showAuth() {
        document.getElementById('auth-modal').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }

    showApp() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        
        // Update user info
        document.getElementById('user-name').textContent = this.state.user?.name || 'User';
        
        // Load current page
        this.loadPage(this.state.currentPage);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const icon = document.querySelector('#theme-toggle i');
        icon.className = this.state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    navigateTo(page) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            transactions: 'Transactions',
            budgets: 'Budgets',
            bills: 'Bills',
            goals: 'Goals',
            reports: 'Reports'
        };
        
        const subtitles = {
            dashboard: 'Overview of your financial health',
            transactions: 'Manage your income and expenses',
            budgets: 'Plan and track your spending',
            bills: 'Keep track of recurring payments',
            goals: 'Save for your financial objectives',
            reports: 'Analyze your financial patterns'
        };

        document.getElementById('page-title').textContent = titles[page];
        document.getElementById('page-subtitle').textContent = subtitles[page];

        // Load page content
        this.loadPage(page);
        this.state.currentPage = page;
    }

    async loadPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show current page
        const pageElement = document.getElementById(`${page}-page`);
        pageElement.classList.add('active');

        // Load page-specific content
        try {
            switch (page) {
                case 'dashboard':
                    if (window.dashboardPage) {
                        await window.dashboardPage.load();
                    }
                    break;
                case 'transactions':
                    if (window.transactionsPage) {
                        await window.transactionsPage.load();
                    }
                    break;
                case 'budgets':
                    if (window.budgetsPage) {
                        await window.budgetsPage.load();
                    }
                    break;
                case 'bills':
                    if (window.billsPage) {
                        await window.billsPage.load();
                    }
                    break;
                case 'goals':
                    if (window.goalsPage) {
                        await window.goalsPage.load();
                    }
                    break;
                case 'reports':
                    // Reports functionality
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${page} page:`, error);
            this.notifications.error(`Failed to load ${page} page`);
        }
    }

    async logout() {
        try {
            await this.api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.state.clearAuth();
            this.showAuth();
            this.notifications.success('Logged out successfully');
        }
    }

    showTransactionModal() {
        // This will be implemented with the transaction modal
        if (window.transactionModal) {
            window.transactionModal.show();
        }
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Data refresh
    async refreshData() {
        try {
            // Refresh current page data
            await this.loadPage(this.state.currentPage);
        } catch (error) {
            console.error('Data refresh failed:', error);
            this.notifications.error('Failed to refresh data');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
});

// Export for use in other modules
window.utils = utils;
window.CONFIG = CONFIG;