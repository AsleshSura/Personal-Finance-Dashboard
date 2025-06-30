# Netlify + Heroku Deployment Guide

## Why This Stack:
- **Netlify:** Excellent frontend hosting with forms, functions
- **Heroku:** Mature platform, lots of add-ons

## Steps:

### 1. Prepare for Heroku
Create `backend/Procfile`:
```
web: node server.js
```

### 2. Backend on Heroku
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Commands:
```bash
cd backend
heroku create your-finance-api
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secure-secret
heroku config:set MONGODB_URI=your-mongodb-connection-string
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 3. Frontend on Netlify
1. Go to [Netlify](https://netlify.com)
2. Drag and drop your `frontend` folder
3. Or connect GitHub repository

### 4. Custom Domain (Optional)
- Netlify: Free subdomains, custom domains available
- Heroku: Custom domains on paid plans

## Cost:
- Heroku: Free tier discontinued, starts at $7/month
- Netlify: Free tier generous, paid plans start at $19/month
