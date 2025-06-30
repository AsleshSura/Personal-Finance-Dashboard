const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database');
        
        // Create tables if they don't exist
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
                    amount REAL NOT NULL CHECK (amount > 0),
                    description TEXT NOT NULL,
                    category TEXT NOT NULL,
                    date TEXT NOT NULL,
                    tags TEXT DEFAULT '[]',
                    receipt TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`);
            
            console.log('✅ Database tables initialized');
        });
    }
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5001', 'http://127.0.0.1:5001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Personal Finance Dashboard Desktop App is running',
        timestamp: new Date().toISOString(),
        environment: 'desktop',
        database: 'SQLite'
    });
});

// Simple auth endpoints for compatibility
app.get('/api/auth/me', (req, res) => {
    res.json({
        id: 'desktop-user',
        name: 'User',
        email: 'user@localhost',
        currency: 'USD',
        theme: 'light'
    });
});

// Get all transactions
app.get('/api/transactions', (req, res) => {
    const { category, search, limit = 50, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    let params = [];
    
    if (category && category !== 'all') {
        sql += ' AND category = ?';
        params.push(category);
    }
    
    if (search) {
        sql += ' AND (description LIKE ? OR category LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching transactions:', err);
            return res.status(500).json({ error: 'Failed to fetch transactions' });
        }
        
        // Parse tags for each transaction
        const transactions = rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));
        
        res.json(transactions);
    });
});

// Create transaction
app.post('/api/transactions', (req, res) => {
    const { type, amount, description, category, date, tags = [], receipt = null } = req.body;
    
    // Validation
    if (!type || !amount || !description || !category || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Type must be income or expense' });
    }
    
    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    const sql = `
        INSERT INTO transactions (type, amount, description, category, date, tags, receipt, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const params = [type, amount, description, category, date, JSON.stringify(tags), receipt];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error creating transaction:', err);
            return res.status(500).json({ error: 'Failed to create transaction' });
        }
        
        // Fetch the created transaction
        db.get('SELECT * FROM transactions WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                console.error('Error fetching created transaction:', err);
                return res.status(500).json({ error: 'Transaction created but failed to fetch' });
            }
            
            const transaction = {
                ...row,
                tags: JSON.parse(row.tags || '[]')
            };
            
            res.status(201).json(transaction);
        });
    });
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { type, amount, description, category, date, tags = [], receipt = null } = req.body;
    
    // Validation
    if (!type || !amount || !description || !category || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sql = `
        UPDATE transactions 
        SET type = ?, amount = ?, description = ?, category = ?, date = ?, tags = ?, receipt = ?, updated_at = datetime('now')
        WHERE id = ?
    `;
    
    const params = [type, amount, description, category, date, JSON.stringify(tags), receipt, id];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error updating transaction:', err);
            return res.status(500).json({ error: 'Failed to update transaction' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Fetch the updated transaction
        db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Error fetching updated transaction:', err);
                return res.status(500).json({ error: 'Transaction updated but failed to fetch' });
            }
            
            const transaction = {
                ...row,
                tags: JSON.parse(row.tags || '[]')
            };
            
            res.json(transaction);
        });
    });
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting transaction:', err);
            return res.status(500).json({ error: 'Failed to delete transaction' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({ message: 'Transaction deleted successfully' });
    });
});

// Get unique categories
app.get('/api/categories', (req, res) => {
    db.all('SELECT DISTINCT category FROM transactions ORDER BY category', [], (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        
        const categories = rows.map(row => row.category);
        res.json(categories);
    });
});

// Get transaction statistics
app.get('/api/stats', (req, res) => {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
        dateFilter = ' AND date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }
    
    const queries = {
        totalIncome: `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'${dateFilter}`,
        totalExpenses: `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'${dateFilter}`,
        transactionCount: `SELECT COUNT(*) as count FROM transactions WHERE 1=1${dateFilter}`,
        categoryBreakdown: `SELECT category, type, SUM(amount) as total FROM transactions WHERE 1=1${dateFilter} GROUP BY category, type ORDER BY total DESC`
    };
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    for (const [key, query] of Object.entries(queries)) {
        if (key === 'categoryBreakdown') {
            db.all(query, params, (err, rows) => {
                if (err) {
                    console.error(`Error in ${key} query:`, err);
                    results[key] = [];
                } else {
                    results[key] = rows;
                }
                
                completed++;
                if (completed === total) {
                    const netBalance = (results.totalIncome?.total || 0) - (results.totalExpenses?.total || 0);
                    res.json({
                        ...results,
                        netBalance,
                        period: startDate && endDate ? { startDate, endDate } : 'all-time'
                    });
                }
            });
        } else {
            db.get(query, params, (err, row) => {
                if (err) {
                    console.error(`Error in ${key} query:`, err);
                    results[key] = { total: 0 };
                } else {
                    results[key] = row;
                }
                
                completed++;
                if (completed === total) {
                    const netBalance = (results.totalIncome?.total || 0) - (results.totalExpenses?.total || 0);
                    res.json({
                        ...results,
                        netBalance,
                        period: startDate && endDate ? { startDate, endDate } : 'all-time'
                    });
                }
            });
        }
    }
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Personal Finance Desktop App running on http://localhost:${PORT}`);
    console.log(`📁 Database: ${dbPath}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
