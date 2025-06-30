// storage.js - LocalStorage CRUD helpers for static Personal Finance Dashboard

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
