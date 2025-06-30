# Personal Finance Dashboard

---

## Cross-File Integration Overview

This project is fully modular and interconnected. Each file references and interacts with the others for a robust, maintainable codebase:

- **index.html**: Loads all scripts (`storage.js`, `utils.js`, `main.js`) in order. All IDs/classes referenced in JS/CSS are present here. Dynamic content is rendered by `main.js` using helpers from `utils.js` and `storage.js`.
- **main.js**: Main app logic. Uses `window.utils` (from `utils.js`) for formatting, ID generation, and chart helpers. Uses `window.Storage` (from `storage.js`) for all persistent data. All DOM elements referenced are defined in `index.html`.
- **utils.js**: Utility functions. Used by `main.js` for formatting, ID generation, and chart helpers. References `window.Storage` for data validation/logging. Globally accessible as `window.utils`.
- **storage.js**: LocalStorage CRUD helpers. Used by `main.js` for all persistent data. References `window.utils` for data validation/logging. Globally accessible as `window.Storage`.
- **style.css**: Styles all IDs/classes referenced in `index.html` and `main.js`. All selectors are documented and cross-referenced in HTML and JS files.

---

## File Relationships

- All scripts are loaded in order in `index.html`.
- All global objects (`window.Storage`, `window.utils`) are referenced and documented in every relevant file.
- Each file contains explicit comments and usage examples showing how it interacts with the others.

---

## For More Details

See the top of each file for a summary of its cross-file integration and usage examples.

---

## 🚀 Features
- **Dashboard**: At-a-glance summary cards, analytics, and quick stats
- **Transactions**: Add, edit, delete, duplicate; custom categories, tags, notes, file attachments; recurring transactions; advanced filtering/search
- **Budgets**: Set, track, and get alerts for custom budgets; CSV import/export
- **Bills**: Add, edit, delete, mark as paid; recurring bills; quick add from empty state
- **Goals**: Set, track, and mark financial goals; quick add from empty state
- **Reports**: Download/import transactions, budgets, bills, and goals as CSV; export all data as JSON
- **Trends**: Visualize spending, cash flow, and net worth over time with interactive charts
- **Calendar**: See daily expenses, upcoming bills, and goals
- **Category Manager**: Add, edit, and organize custom categories
- **Dark/Light Mode**: Instantly switch themes and accent colors
- **Notifications**: Alerts for actions, reminders, and errors
- **Attachment Gallery**: View all uploaded files in one place
- **Audit Log**: Track add/edit/delete actions (basic)
- **Planned**: Multi-currency, advanced investment analytics, AI-powered insights, shared budgets/accounts, calendar/notification integrations

---

## 🛠️ Getting Started
1. **Download or clone this repository.**
2. Open `index.html` in your browser (no build or server needed).
3. Start adding your transactions and customizing your dashboard!

---

## 📁 Project Structure
- `index.html` — Main UI, navigation, dashboard, modals, and all app sections
- `style.css` — All styles, themes, and responsive layout
- `main.js` — App logic, CRUD, navigation, rendering, chart logic, empty state handling, modal logic
- `storage.js` — LocalStorage helpers for persistent data
- `utils.js` — Utility/helper functions for formatting, chart helpers, etc.
- `README.md` — Project documentation
- `LICENSE` — MIT License

---

## 🧩 Customization & Tips
- **Categories**: Add/edit categories for personalized tracking
- **Themes**: Switch between dark/light mode and accent colors
- **Data Import/Export**: Use the Reports section to backup or migrate your data
- **Quick Add**: Use the "+ Add" buttons in empty states to quickly create bills or goals
- **Charts**: Add a few transactions to see interactive charts and trends
- **Attachments**: Upload receipts or documents to transactions for better record-keeping

---

## 🔒 Privacy & Data
- All data is stored locally in your browser (localStorage)
- No accounts, no tracking, no cloud—your data is yours
- Export your data at any time for backup or migration

---

## 📊 Net Worth & Investment Tracking
- **Net Worth Over Time**: Visualize your net worth growth with a dedicated chart on the Trends page
- **Investment Tracking**: Add investment accounts and track their value alongside your other assets
- **Net Worth Widget**: See your current net worth on the dashboard at a glance
- **Cash Flow Analysis**: Compare income and expenses to understand your financial trajectory

To use these features, add your assets, liabilities, and investments as transactions or accounts. The dashboard and Trends page will update automatically.

---

## 🗺️ Roadmap
- Multi-currency support
- Advanced investment analytics
- AI-powered insights and suggestions
- Shared budgets/accounts
- Calendar/notification integrations

---

## 📸 Screenshots
_Add screenshots here to showcase the dashboard, charts, and features._

---

## 💡 FAQ
**Q: Is my data safe?**  
A: Yes! All data is stored locally in your browser. No data ever leaves your device.

**Q: Can I use this offline?**  
A: Yes! The app is fully functional offline after the first load.

**Q: How do I backup or migrate my data?**  
A: Use the Reports section to export/import CSV or JSON files.

**Q: Can I customize categories and themes?**  
A: Absolutely! Use the Category Manager and Theme toggle in the app.

---

## 📄 License
MIT
