#!/usr/bin/env node

/**
 * Repository Health Check Script
 * Validates the Personal Finance Dashboard for common issues
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();
const BACKEND_DIR = path.join(REPO_ROOT, 'backend');
const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');

let issues = [];
let warnings = [];

console.log('🔍 Running Personal Finance Dashboard Health Check...\n');

// Check 1: Required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
    'backend/server.js',
    'backend/package.json',
    'backend/.env.example',
    'backend/models/User.js',
    'backend/models/Bill.js',
    'backend/models/Budget.js',
    'backend/models/Goal.js',
    'backend/models/Transactions.js',
    'backend/routes/auth.js',
    'backend/routes/bills.js',
    'backend/routes/budgets.js',
    'backend/routes/goals.js',
    'backend/routes/transactions.js',
    'backend/middleware/auth.js',
    'frontend/index.html',
    'frontend/css/style.css',
    'frontend/js/app.js',
    'frontend/js/auth.js',
    'frontend/js/dashboard.js',
    '.gitignore',
    'README.md'
];

requiredFiles.forEach(file => {
    const filePath = path.join(REPO_ROOT, file);
    if (!fs.existsSync(filePath)) {
        issues.push(`Missing required file: ${file}`);
    }
});

// Check 2: .env file is not in git
console.log('🔒 Checking security...');
if (fs.existsSync(path.join(BACKEND_DIR, '.env'))) {
    warnings.push('.env file exists - ensure it\'s in .gitignore');
}

// Check 3: Upload directories exist
console.log('📂 Checking upload directories...');
const uploadDirs = [
    'backend/uploads/bills',
    'backend/uploads/receipts'
];

uploadDirs.forEach(dir => {
    const dirPath = path.join(REPO_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
        warnings.push(`Upload directory missing: ${dir} (will be created on first upload)`);
    }
});

// Check 4: Package.json dependencies
console.log('📦 Checking dependencies...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(BACKEND_DIR, 'package.json'), 'utf8'));
    
    const criticalDeps = [
        'express',
        'mongoose',
        'bcrypt',
        'jsonwebtoken',
        'cors',
        'dotenv',
        'multer',
        'express-validator'
    ];
    
    criticalDeps.forEach(dep => {
        if (!packageJson.dependencies[dep]) {
            issues.push(`Missing critical dependency: ${dep}`);
        }
    });
    
    // Check for outdated csv-parse
    if (packageJson.dependencies['csv-parse'] && packageJson.dependencies['csv-parse'].includes('^3.')) {
        warnings.push('csv-parse is using old version ^3.x, consider upgrading to ^5.x');
    }
    
} catch (error) {
    issues.push('Could not read backend/package.json');
}

// Check 5: Model method existence
console.log('🔧 Checking model methods...');
try {
    // Check if Bill model has required static methods
    const billModel = fs.readFileSync(path.join(BACKEND_DIR, 'models/Bill.js'), 'utf8');
    const requiredBillMethods = ['getUpcomingBills', 'getOverdueBills', 'getBillsSummary'];
    
    requiredBillMethods.forEach(method => {
        if (!billModel.includes(`statics.${method}`)) {
            issues.push(`Bill model missing method: ${method}`);
        }
    });
    
    // Check if Transaction model has required static methods
    const transactionModel = fs.readFileSync(path.join(BACKEND_DIR, 'models/Transactions.js'), 'utf8');
    const requiredTransactionMethods = ['getCategorySummary', 'getMonthlySummary', 'getByDateRange'];
    
    requiredTransactionMethods.forEach(method => {
        if (!transactionModel.includes(`statics.${method}`)) {
            issues.push(`Transaction model missing method: ${method}`);
        }
    });
    
} catch (error) {
    issues.push('Could not validate model methods');
}

// Check 6: Environment variables
console.log('🌍 Checking environment configuration...');
try {
    const envExample = fs.readFileSync(path.join(BACKEND_DIR, '.env.example'), 'utf8');
    const requiredVars = ['JWT_SECRET', 'MONGODB_URI', 'PORT'];
    
    requiredVars.forEach(varName => {
        if (!envExample.includes(varName)) {
            warnings.push(`Environment variable not documented in .env.example: ${varName}`);
        }
    });
} catch (error) {
    warnings.push('Could not read .env.example file');
}

// Results
console.log('\n📊 Health Check Results:\n');

if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Your repository is healthy.');
} else {
    if (issues.length > 0) {
        console.log('🚨 Critical Issues Found:');
        issues.forEach(issue => console.log(`  ❌ ${issue}`));
        console.log('');
    }
    
    if (warnings.length > 0) {
        console.log('⚠️  Warnings:');
        warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
        console.log('');
    }
}

console.log(`📈 Summary: ${issues.length} critical issues, ${warnings.length} warnings\n`);

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);
