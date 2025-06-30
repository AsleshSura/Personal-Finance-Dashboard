// Full-Stack Deployment Configuration
// Frontend: Vercel, Backend: Railway, Database: MongoDB Atlas

const CONFIG = {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://personal-finance-dashboard-production.up.railway.app/api'
        : 'http://localhost:5000/api',
    TOKEN_KEY: 'finance_dashboard_token',
    USER_KEY: 'finance_dashboard_user',
    PRODUCTION_MODE: true
};
