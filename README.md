# Personal Finance Dashboard - Desktop App

A simple, offline desktop application for personal finance management built with Electron and SQLite.

## 🚀 Features

- ✅ **Transaction Management** - Add, edit, delete, and search transactions
- ✅ **Category Filtering** - Organize transactions by categories
- ✅ **Local Storage** - All data stored locally in SQLite database
- ✅ **Offline Operation** - No internet connection required
- ✅ **Desktop Native** - Runs as a Windows desktop application

## 🎯 How to Run

### Option 1: Quick Start (Recommended)
Double-click `start-desktop.bat`

### Option 2: Command Line
```bash
npm start
```

### First Time Setup
```bash
npm run setup          # Install backend dependencies
```

## 🏗️ Project Structure

```
Personal-Finance-Dashboard/
├── main.js                    # Electron main process
├── start-desktop.bat          # Windows startup script
├── package.json               # Desktop app dependencies
├── frontend/
│   ├── index.html            # Main app interface
│   ├── css/style.css         # App styling
│   └── js/
│       ├── app.js            # Main app logic
│       ├── dashboard.js      # Dashboard functionality
│       └── transactions.js   # Transaction management
└── backend/
    ├── simple-server.js      # Express + SQLite server
    ├── database.sqlite       # Local SQLite database
    └── package.json          # Backend dependencies
```

## 💾 Database

- **Type**: SQLite (local file)
- **Location**: `backend/database.sqlite`
- **No setup required** - database is created automatically

## 🛠️ Technical Details

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js + Express + SQLite
- **Desktop**: Electron
- **Database**: better-sqlite3
- **No authentication** - simple offline app

## 📝 License

MIT License - see LICENSE file for details.
