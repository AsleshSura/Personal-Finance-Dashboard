const bcrypt = require('bcryptjs');
const prisma = require('../lib/db');

class User {
    // Create a new user
    static async create(userData) {
        const { name, email, password, ...otherData } = userData;
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                ...otherData
            },
            select: {
                id: true,
                name: true,
                email: true,
                currency: true,
                timezone: true,
                dateFormat: true,
                weekStartsOn: true,
                theme: true,
                notifications: true,
                emailReminders: true,
                totalBalance: true,
                monthlyIncome: true,
                monthlyExpenses: true,
                createdAt: true,
                updatedAt: true
            }
        });
        
        return user;
    }
    
    // Find user by email
    static async findByEmail(email) {
        return await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                currency: true,
                timezone: true,
                dateFormat: true,
                weekStartsOn: true,
                theme: true,
                notifications: true,
                emailReminders: true,
                totalBalance: true,
                monthlyIncome: true,
                monthlyExpenses: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
    
    // Find user by ID
    static async findById(id) {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                currency: true,
                timezone: true,
                dateFormat: true,
                weekStartsOn: true,
                theme: true,
                notifications: true,
                emailReminders: true,
                totalBalance: true,
                monthlyIncome: true,
                monthlyExpenses: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
    
    // Update user
    static async updateById(id, updateData) {
        return await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                currency: true,
                timezone: true,
                dateFormat: true,
                weekStartsOn: true,
                theme: true,
                notifications: true,
                emailReminders: true,
                totalBalance: true,
                monthlyIncome: true,
                monthlyExpenses: true,
                updatedAt: true
            }
        });
    }
    
    // Delete user
    static async deleteById(id) {
        return await prisma.user.delete({
            where: { id }
        });
    }
    
    // Update last login
    static async updateLastLogin(id) {
        return await prisma.user.update({
            where: { id },
            data: { lastLogin: new Date() }
        });
    }
    
    // Validate password
    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    
    // Update financial summary
    static async updateFinancialSummary(id, summary) {
        return await prisma.user.update({
            where: { id },
            data: {
                totalBalance: summary.totalBalance || 0,
                monthlyIncome: summary.monthlyIncome || 0,
                monthlyExpenses: summary.monthlyExpenses || 0
            }
        });
    }
    
    // Get user with statistics
    static async findByIdWithStats(id) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        transactions: true,
                        budgets: true,
                        bills: true,
                        goals: true
                    }
                }
            }
        });
        
        if (!user) return null;
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}

module.exports = User;
