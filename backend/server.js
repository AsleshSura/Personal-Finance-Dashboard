const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { error } = require('console');
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
        message: 'Personal Finance Dashboard API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_dashboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('✅ Connected to MongoDB')).catch(err => console.error('❌ MongoDB connection error', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/goals', require('./routes/goals'));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Duplicate entry',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({error: 'Route not found'});
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Finance Dashboard API is ready!`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});