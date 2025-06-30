# Personal Finance Dashboard - Static Offline Web App

A simple, offline personal finance dashboard that runs entirely in your web browser. No installation, server, or database required—just open `frontend/index.html` in any browser.

## 🚀 Features

- ✅ **Transaction Management** - Add, edit, delete, and search transactions
- ✅ **Category Filtering** - Organize transactions by categories
- ✅ **Local Storage** - All data stored in your browser (localStorage)
- ✅ **Offline Operation** - No internet connection required
- ✅ **No Installation** - Works as a static website

## 🏁 How to Use

1. Open the `frontend/index.html` file in your web browser.
2. All features work offline and data is saved in your browser.
3. No setup, server, or installation required.

## 🗂️ Project Structure

```
Personal-Finance-Dashboard/
├── frontend/
│   ├── index.html         # Main app interface
│   ├── css/style.css      # App styling
│   └── js/
│       ├── storage.js     # LocalStorage CRUD helpers
│       ├── main.js        # Main app logic (localStorage-based)
│       ├── app.js         # (legacy, to be cleaned)
│       ├── dashboard.js   # (legacy, to be cleaned)
│       ├── transactions.js# (legacy, to be cleaned)
│       └── ...
├── README.md              # This file
└── ... (no backend/server files)
```

## 💾 Data Storage

- **Type**: Browser localStorage
- **Location**: Your browser (no files created)
- **No setup required** - data is saved automatically

## ⚙️ Technical Details

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **No backend/server/database**
- **No authentication** - simple offline app

---

**Note:** This project is now a pure static website. All backend, server, and database files have been removed. For best results, use a modern browser (Chrome, Edge, Firefox, Safari, etc.).
