const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

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
        environment: process.env.NODE_ENV || 'development',
        database: 'PostgreSQL'
    });
});

// Test database connection
async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL Database');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
connectDatabase();

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

    // Prisma specific errors
    if (err.code === 'P2002') {
        return res.status(400).json({
            error: 'Duplicate entry',
            field: err.meta?.target?.[0] || 'unknown'
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Record not found'
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

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Finance Dashboard API is ready!`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.log(`💡 Try killing the process using port ${PORT}`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔄 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});