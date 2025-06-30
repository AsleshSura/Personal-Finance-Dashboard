# Vercel + Railway Deployment Guide

## Why This Stack:
- **Vercel:** Best for frontend hosting (free, fast CDN, automatic deployments)
- **Railway:** Great for backend hosting (generous free tier, automatic scaling)

## Steps:

### 1. Backend on Railway
1. Go to [Railway](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js backend

#### Environment Variables:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/finance_dashboard
JWT_SECRET=your-super-secure-jwt-secret-here
PORT=8080
FRONTEND_URL=https://your-app.vercel.app
```

**⚠️ SECURITY WARNING:**
- Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your actual MongoDB Atlas credentials
- Never commit real credentials to your repository
- Use Railway's environment variables dashboard to set these securely

### 2. Database on MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Get connection string
4. Add to Railway environment variables

### 3. Frontend on Vercel
1. Go to [Vercel](https://vercel.com)
2. "New Project" → Import from GitHub
3. **Important:** Set root directory to `frontend`
4. Deploy

### 4. Update API Configuration
Create `frontend/js/config.js`:
```javascript
const API_CONFIG = {
    baseURL: 'https://your-railway-app.up.railway.app/api',
    timeout: 10000
};
```

Update `frontend/js/app.js`:
```javascript
// Replace the baseURL line with:
this.baseURL = API_CONFIG.baseURL;
```

Add to `frontend/index.html` before other scripts:
```html
<script src="js/config.js"></script>
```

## Cost: FREE
- Railway: 500 hours/month free
- Vercel: Unlimited for personal projects
- MongoDB Atlas: 512MB free forever
