// --- app.js content ---
// ...app.js code here (already in previous read)...
// --- dashboard.js content ---
// ...dashboard.js code here (class DashboardPage only, no DOMContentLoaded)...
// --- transactions.js content ---
// ...transactions.js code here (class TransactionManager only, no DOMContentLoaded or exports)...

// Attach managers to window for app usage
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
    window.dashboardPage = new DashboardPage();
    window.transactionManager = new TransactionManager();
});

window.utils = utils;
window.CONFIG = CONFIG;
