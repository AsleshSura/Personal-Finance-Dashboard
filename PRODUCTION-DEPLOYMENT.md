# 🚀 Production Deployment Guide

This guide will help you deploy the full-featured Personal Finance Dashboard to production using:
- **Frontend**: Vercel (frontend hosting)
- **Backend**: Railway (API hosting)
- **Database**: Railway PostgreSQL (free tier available)

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to GitHub
2. **Accounts**: Sign up for free accounts on:
   - [Vercel](https://vercel.com) 
   - [Railway](https://railway.app)

## Step 1: Deploy Backend to Railway (with PostgreSQL)

1. **Sign Up**: Go to [Railway](https://railway.app) and sign up with GitHub
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: 
   - Select "Deploy from GitHub repo"
   - Choose your `Personal-Finance-Dashboard` repository
4. **Add PostgreSQL Database**:
   - In your project dashboard, click "New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will provision a free PostgreSQL database
5. **Configure Build Settings**:
   - Root Directory: `backend`
   - Start Command: `node server.js`
6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long
   PORT=5000
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
   Note: `${{Postgres.DATABASE_URL}}` is automatically provided by Railway
7. **Deploy**: Railway will automatically build and deploy
8. **Get Railway URL**: Copy your Railway app URL (e.g., `https://personal-finance-dashboard-production.up.railway.app`)

## Step 2: Deploy Frontend to Vercel

1. **Sign Up**: Go to [Vercel](https://vercel.com) and sign up with GitHub
2. **Import Project**: Click "New Project" → "Import Git Repository"
3. **Select Repository**: Choose your `Personal-Finance-Dashboard` repository
4. **Configure Project**:
   - Framework Preset: "Other"
   - Root Directory: Leave empty (we have vercel.json configuration)
   - Build Command: Leave empty
   - Output Directory: `frontend`
5. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api
   NODE_ENV=production
   ```
6. **Deploy**: Click "Deploy"
7. **Update Backend URL**: After deployment, update the `API_BASE_URL` in Railway:
   - Go to Railway → Your Project → Variables
   - Update `FRONTEND_URL` to your Vercel URL

## Step 4: Update API Configuration

1. **Update Frontend Config**: The frontend `app.js` should automatically detect Vercel hosting
2. **Test API Connection**: Visit your Vercel URL and try to register/login

## Step 5: Set Up Custom Domain (Optional)

### For Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### For Railway:
1. Go to Railway Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

## Step 6: Environment Variables Reference

### Railway (Backend):
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-256-bit-secret-key-here
PORT=5000
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Vercel (Frontend):
```env
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app/api
NODE_ENV=production
```

## Testing Your Deployment

1. **Health Check**: Visit `https://your-railway-app.up.railway.app/api/health`
2. **Frontend**: Visit your Vercel URL
3. **Registration**: Try creating a new account
4. **Features**: Test transactions, budgets, bills, and goals

## Troubleshooting

### Common Issues:

1. **CORS Errors**: 
   - Ensure `FRONTEND_URL` in Railway matches your Vercel URL exactly
   - Check Railway logs for CORS configuration

2. **Database Connection**:
   - Verify Railway PostgreSQL service is running
   - Check DATABASE_URL environment variable is set correctly

3. **API Not Loading**:
   - Verify Railway service is running
   - Check Railway logs for errors
   - Ensure API_BASE_URL in frontend matches Railway URL

4. **Build Failures**:
   - Check Railway build logs
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

### Logs and Debugging:

- **Railway Logs**: Dashboard → Your Project → Deployments → View Logs
- **Vercel Logs**: Dashboard → Your Project → Functions → View Logs
- **MongoDB Atlas**: Monitoring tab for connection issues

## Production Checklist

- [ ] Railway backend deployed with PostgreSQL database
- [ ] Database schema migrated automatically via Prisma
- [ ] All environment variables set correctly in Railway
- [ ] Vercel frontend deployed and pointing to Railway API
- [ ] CORS configuration updated with production URLs
- [ ] JWT secret set to a secure random string
- [ ] Health check endpoint accessible
- [ ] Registration and login working
- [ ] All features (transactions, budgets, bills, goals) functional
- [ ] Custom domains configured (if desired)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway and Vercel logs
3. Ensure all environment variables are set correctly
4. Verify PostgreSQL database connectivity

Your Personal Finance Dashboard is now live and ready for real users! 🎉

## Technology Stack Used

- **Frontend**: Vanilla JavaScript + Vercel hosting
- **Backend**: Node.js + Express + Railway hosting  
- **Database**: PostgreSQL on Railway (free tier)
- **ORM**: Prisma for type-safe database access
- **Authentication**: JWT tokens
- **File Storage**: Railway persistent volumes
