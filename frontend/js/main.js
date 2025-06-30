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
});
// --- END STATIC WEBSITE CODE ---
