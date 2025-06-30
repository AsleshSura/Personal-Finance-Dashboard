const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Make Prisma client available globally
global.prisma = prisma;

module.exports = prisma;
