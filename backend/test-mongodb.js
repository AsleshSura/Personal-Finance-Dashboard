// Quick MongoDB connection test
const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    try {
        console.log('🔄 Testing MongoDB connection...');
        console.log('📍 Connection string:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finance_dashboard');
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finance_dashboard', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB connected successfully!');
        console.log('📊 Database ready for Personal Finance Dashboard');
        
        // Test if we can create a simple document
        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);
        
        const testDoc = new TestModel({ test: 'connection_test' });
        await testDoc.save();
        
        console.log('✅ Database write test successful!');
        
        // Clean up test document
        await TestModel.deleteOne({ test: 'connection_test' });
        console.log('✅ Database cleanup successful!');
        
        mongoose.connection.close();
        console.log('🎉 All tests passed! Your database is ready.');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 SOLUTION: Install and start MongoDB');
            console.log('1. Download MongoDB from: https://www.mongodb.com/try/download/community');
            console.log('2. Install with "Install MongoDB as a Service" option');
            console.log('3. Restart this test');
        }
        
        process.exit(1);
    }
};

testConnection();
