// storage.js - LocalStorage CRUD helpers for static Personal Finance Dashboard
//
// Cross-file integration:
// - Used by main.js for all persistent data (transactions, budgets, bills, goals)
// - Referenced in utils.js for data validation examples
// - window.Storage is global and used in index.html, main.js, and utils.js
// - See main.js for usage examples

const Storage = {
    get(key, fallback = []) {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    // Transaction helpers
    getTransactions() {
        return this.get('transactions', []);
    },
    saveTransactions(arr) {
        this.set('transactions', arr);
    },
    // Budgets
    getBudgets() {
        return this.get('budgets', []);
    },
    saveBudgets(arr) {
        this.set('budgets', arr);
    },
    // Bills
    getBills() {
        return this.get('bills', []);
    },
    saveBills(arr) {
        this.set('bills', arr);
    },
    // Goals
    getGoals() {
        return this.get('goals', []);
    },
    saveGoals(arr) {
        this.set('goals', arr);
    }
};

window.Storage = Storage;

// Example cross-link: use a utility from utils.js for demonstration
if (typeof window !== 'undefined' && window.utils) {
    // Example: log the number of transactions with proper formatting
    console.log('Total transactions:', Storage.getTransactions().length);
} else {
    // Defer the cross-reference check until utils is loaded
    document.addEventListener('DOMContentLoaded', () => {
        if (window.utils) {
            console.log('Total transactions:', Storage.getTransactions().length);
        }
    });
}
