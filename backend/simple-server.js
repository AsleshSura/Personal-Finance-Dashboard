const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize SQLite database
let db;
try {
    const dbPath = path.join(__dirname, 'database.sqlite');
    db = new Database(dbPath);
    
    // Create tables if they don't exist
    db.exec(`
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
        );
        
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    `);
    
    console.log('✅ SQLite Database initialized');
} catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
}

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

// Transaction endpoints
app.get('/api/transactions', (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            category,
            startDate,
            endDate,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM transactions WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE 1=1';
        const params = [];
        const countParams = [];

        // Apply filters
        if (type) {
            query += ' AND type = ?';
            countQuery += ' AND type = ?';
            params.push(type);
            countParams.push(type);
        }

        if (category) {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (startDate) {
            query += ' AND date >= ?';
            countQuery += ' AND date >= ?';
            params.push(startDate);
            countParams.push(startDate);
        }

        if (endDate) {
            query += ' AND date <= ?';
            countQuery += ' AND date <= ?';
            params.push(endDate);
            countParams.push(endDate);
        }

        if (search) {
            query += ' AND (description LIKE ? OR category LIKE ?)';
            countQuery += ' AND (description LIKE ? OR category LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        // Add sorting and pagination
        query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        // Execute queries
        const stmt = db.prepare(query);
        const transactions = stmt.all(...params);
        
        const countStmt = db.prepare(countQuery);
        const totalResult = countStmt.get(...countParams);
        const total = totalResult.total;

        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch transactions'
        });
    }
});

app.post('/api/transactions', (req, res) => {
    try {
        const {
            type,
            amount,
            description,
            category,
            date = new Date().toISOString().split('T')[0],
            tags = [],
            receipt
        } = req.body;

        // Basic validation
        if (!type || !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'Type must be income or expense' });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        if (!description || description.trim().length === 0) {
            return res.status(400).json({ error: 'Description is required' });
        }
        if (!category || category.trim().length === 0) {
            return res.status(400).json({ error: 'Category is required' });
        }

        const insertQuery = `
            INSERT INTO transactions (type, amount, description, category, date, tags, receipt, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

        const tagsJson = JSON.stringify(tags);
        const stmt = db.prepare(insertQuery);
        const result = stmt.run(type, amount, description, category, date, tagsJson, receipt);

        // Get the created transaction
        const getStmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
        const transaction = getStmt.get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: {
                ...transaction,
                tags: JSON.parse(transaction.tags || '[]')
            }
        });

    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to create transaction'
        });
    }
});

app.get('/api/transactions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
        const transaction = stmt.get(id);

        if (!transaction) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Transaction not found'
            });
        }

        res.json({
            ...transaction,
            tags: JSON.parse(transaction.tags || '[]')
        });

    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch transaction'
        });
    }
});

app.put('/api/transactions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check if transaction exists
        const existingStmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
        const existing = existingStmt.get(id);
        if (!existing) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Transaction not found'
            });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'id') {
                updateFields.push(`${key} = ?`);
                if (key === 'tags') {
                    updateValues.push(JSON.stringify(updates[key]));
                } else {
                    updateValues.push(updates[key]);
                }
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'No valid fields to update'
            });
        }

        updateFields.push('updated_at = datetime(\'now\')');
        updateValues.push(id);

        const updateQuery = `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`;
        const updateStmt = db.prepare(updateQuery);
        updateStmt.run(...updateValues);

        // Get updated transaction
        const updatedStmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
        const updated = updatedStmt.get(id);

        res.json({
            message: 'Transaction updated successfully',
            transaction: {
                ...updated,
                tags: JSON.parse(updated.tags || '[]')
            }
        });

    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to update transaction'
        });
    }
});

app.delete('/api/transactions/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Check if transaction exists
        const existingStmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
        const existing = existingStmt.get(id);
        if (!existing) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Transaction not found'
            });
        }

        // Delete transaction
        const deleteStmt = db.prepare('DELETE FROM transactions WHERE id = ?');
        deleteStmt.run(id);

        res.json({
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to delete transaction'
        });
    }
});

// Analytics endpoint
app.get('/api/transactions/analytics/summary', (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        let dateFilter = '';
        const now = new Date();
        
        switch (period) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = `AND date >= '${weekAgo.toISOString().split('T')[0]}'`;
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = `AND date >= '${monthAgo.toISOString().split('T')[0]}'`;
                break;
            case 'year':
                const yearAgo = new Date(now.getFullYear(), 0, 1);
                dateFilter = `AND date >= '${yearAgo.toISOString().split('T')[0]}'`;
                break;
        }

        const incomeStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE type = 'income' ${dateFilter}
        `);
        const incomeResult = incomeStmt.get();

        const expenseStmt = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE type = 'expense' ${dateFilter}
        `);
        const expenseResult = expenseStmt.get();

        const categoryStmt = db.prepare(`
            SELECT category, type, SUM(amount) as total, COUNT(*) as count
            FROM transactions 
            WHERE 1=1 ${dateFilter}
            GROUP BY category, type
            ORDER BY total DESC
        `);
        const categoryResults = categoryStmt.all();

        res.json({
            income: incomeResult.total,
            expenses: expenseResult.total,
            net: incomeResult.total - expenseResult.total,
            categories: categoryResults,
            period
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to fetch analytics'
        });
    }
});

// Serve the frontend for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Personal Finance Desktop App running on http://localhost:${PORT}`);
    console.log(`📊 Database: SQLite (${path.join(__dirname, 'database.sqlite')})`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down server...');
    if (db) {
        db.close();
        console.log('📊 Database connection closed.');
    }
    process.exit(0);
});
