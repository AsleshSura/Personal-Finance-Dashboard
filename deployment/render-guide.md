# Render Deployment Guide

## Prerequisites
- GitHub account
- Your code pushed to a public GitHub repository

## Steps:

### 1. Database Setup
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL" (or use MongoDB Atlas for free MongoDB)
3. Name: `finance-dashboard-db`
4. Plan: Free
5. Copy the connection string

### 2. Backend Deployment
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Settings:
   - **Name:** `finance-dashboard-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Auto-Deploy:** Yes

### 3. Environment Variables
Add these in Render dashboard under "Environment":
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your-database-connection-string
JWT_SECRET=your-super-secure-random-string-here
FRONTEND_URL=https://your-app-name.onrender.com
```

### 4. Frontend Deployment
1. Click "New" → "Static Site"
2. Connect same GitHub repository
3. Settings:
   - **Name:** `finance-dashboard`
   - **Build Command:** `echo "Static site"`
   - **Publish Directory:** `frontend`

### 5. Update Frontend API URL
Update `frontend/js/app.js` line ~20:
```javascript
this.baseURL = 'https://your-backend-name.onrender.com/api';
```

## Cost: FREE (with limitations)
- Backend sleeps after 15 minutes of inactivity
- 750 hours/month free
- No custom domain on free tier
