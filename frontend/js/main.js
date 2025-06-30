// --- BEGIN MERGED CODE ---
// 1. Utility functions and classes (from app.js)
// Desktop App Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5001/api',
    DESKTOP_MODE: true,
    PRODUCTION_MODE: false
};

class AppState {
    constructor() {
        this.state = {
            transactions: [],
            filters: {
                dateRange: null,
                category: null,
                searchTerm: ''
            },
            sort: {
                column: 'date',
                order: 'desc'
            }
        };
    }

    // ...rest of AppState methods...
}

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    async fetchTransactions() {
        // ...method code...
    }

    // ...rest of ApiService methods...
}

class NotificationService {
    static showSuccess(message) {
        // ...method code...
    }

    static showError(message) {
        // ...method code...
    }
}

const utils = {
    formatDate(date) {
        // ...function code...
    },

    // ...rest of utility functions...
};

class FinanceApp {
    constructor() {
        this.appState = new AppState();
        this.apiService = new ApiService();
    }

    async init() {
        // ...method code...
    }

    // ...rest of FinanceApp methods...
}

// 2. DashboardPage class (from dashboard.js)
class DashboardPage {
    constructor() {
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        // ...method code...
    }

    bindEvents() {
        // ...method code...
    }

    updateDashboard() {
        // ...method code...
    }

    // ...rest of DashboardPage methods...
}

// 3. TransactionManager class (from transactions.js)
class TransactionManager {
    constructor() {
        this.transactions = [];
    }

    async loadTransactions() {
        // ...method code...
    }

    addTransaction(transaction) {
        // ...method code...
    }

    deleteTransaction(transactionId) {
        // ...method code...
    }

    updateTransaction(transactionId, updatedData) {
        // ...method code...
    }

    // ...rest of TransactionManager methods...
}

// 4. Attach managers to window and initialize

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
    window.dashboardPage = new DashboardPage();
    window.transactionManager = new TransactionManager();
    window.utils = utils;
    window.CONFIG = CONFIG;
});
// --- END MERGED CODE ---
