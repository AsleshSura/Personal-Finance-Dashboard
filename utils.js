/**
 * Utility functions for Personal Finance Dashboard
 *
 * Cross-file integration:
 * - Used by main.js for all formatting, ID generation, and chart helpers
 * - Referenced in storage.js for data validation/logging
 * - window.utils is global and used in index.html, main.js, and storage.js
 * - See main.js and storage.js for usage examples
 */

const utils = {
    /** Format a date as a locale string. */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString();
    },
    /** Format a number as currency. */
    formatCurrency(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    },
    /** Generate a unique ID. */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    /** Get a readable font color for a given background (for charts). */
    getBarLabelColor(bg) {
        let rgb = bg.match(/\d+/g);
        if (!rgb) return '#000';
        let [r, g, b] = rgb.map(Number);
        let luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        return luminance > 186 ? '#222' : '#fff';
    },
    /** Get chart font color based on theme. */
    getChartFontColor() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : '#222';
    },
    /** Get chart font size. */
    getChartFontSize() {
        return 14;
    }
};

// Export for browser global
if (typeof window !== 'undefined') {
    window.utils = utils;
    // Example cross-link: use Storage from storage.js if available
    if (window.Storage) {
        // Example: log the first transaction's formatted date if exists
        const txs = window.Storage.getTransactions();
        if (txs.length > 0 && txs[0].date) {
            console.log('First transaction date:', utils.formatDate(txs[0].date));
        }
    }
}
