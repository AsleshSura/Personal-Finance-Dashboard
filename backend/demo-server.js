const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));

app.use('/uploads', express.static('uploads'));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Personal Finance Dashboard API is running (Demo Mode)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mode: 'demo'
    });
});

// Demo data endpoints (without MongoDB)
app.get('/api/demo/user', (req, res) => {
    res.json({
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        totalBalance: 5432.10,
        monthlyIncome: 4500.00,
        monthlyExpenses: 3250.75
    });
});

app.get('/api/demo/transactions', (req, res) => {
    res.json([
        {
            id: '1',
            type: 'income',
            amount: 4500.00,
            category: 'Salary',
            description: 'Monthly Salary',
            date: new Date().toISOString(),
            account: 'Checking'
        },
        {
            id: '2',
            type: 'expense',
            amount: 1200.00,
            category: 'Rent',
            description: 'Monthly Rent',
            date: new Date(Date.now() - 86400000).toISOString(),
            account: 'Checking'
        },
        {
            id: '3',
            type: 'expense',
            amount: 450.50,
            category: 'Groceries',
            description: 'Weekly Shopping',
            date: new Date(Date.now() - 172800000).toISOString(),
            account: 'Checking'
        }
    ]);
});

app.get('/api/demo/budgets', (req, res) => {
    res.json([
        {
            id: '1',
            category: 'Groceries',
            budgeted: 600,
            spent: 450.50,
            remaining: 149.50,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        },
        {
            id: '2',
            category: 'Entertainment',
            budgeted: 300,
            spent: 125.75,
            remaining: 174.25,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        }
    ]);
});

app.get('/api/demo/bills', (req, res) => {
    res.json([
        {
            id: '1',
            name: 'Electric Bill',
            amount: 85.50,
            dueDate: new Date(Date.now() + 604800000).toISOString(), // 1 week from now
            isPaid: false,
            category: 'Utilities'
        },
        {
            id: '2',
            name: 'Internet',
            amount: 59.99,
            dueDate: new Date(Date.now() + 1209600000).toISOString(), // 2 weeks from now
            isPaid: true,
            category: 'Utilities'
        }
    ]);
});

app.get('/api/demo/goals', (req, res) => {
    res.json([
        {
            id: '1',
            name: 'Emergency Fund',
            targetAmount: 10000,
            currentAmount: 6500,
            targetDate: '2025-12-31',
            category: 'Savings'
        },
        {
            id: '2',
            name: 'Vacation Fund',
            targetAmount: 3000,
            currentAmount: 850,
            targetDate: '2025-08-15',
            category: 'Travel'
        }
    ]);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({error: 'Route not found'});
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Demo Server running on port ${PORT}`);
    console.log(`📊 Personal Finance Dashboard (Demo Mode)`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💡 Open 'start.html' in your browser to get started`);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.log(`💡 Try running: taskkill /f /im node.exe`);
        console.log(`💡 Or change the port in your .env file: PORT=3001`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
        process.exit(1);
    }
});
