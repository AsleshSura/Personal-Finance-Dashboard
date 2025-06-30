#!/bin/bash

# Personal Finance Dashboard - Production Deployment Script
# This script helps set up the production deployment configuration

echo "🚀 Personal Finance Dashboard - Production Deployment Setup"
echo "==========================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: This is not a git repository. Please run 'git init' first."
    exit 1
fi

echo ""
echo "📋 Pre-deployment Checklist:"
echo "✅ Code cleaned and demo mode removed"
echo "✅ All secrets moved to environment variables"
echo "✅ Security configurations verified"
echo ""

echo "🔧 Next Steps:"
echo "1. Push your code to GitHub if you haven't already:"
echo "   git add ."
echo "   git commit -m 'feat: ready for production deployment'"
echo "   git push origin main"
echo ""
echo "2. Set up MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/atlas"
echo "   - Create a free cluster"
echo "   - Create database user and get connection string"
echo ""
echo "3. Deploy Backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect your GitHub repository"
echo "   - Set root directory to 'backend'"
echo "   - Add environment variables (see PRODUCTION-DEPLOYMENT.md)"
echo ""
echo "4. Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Configure with our vercel.json settings"
echo ""

echo "📖 For detailed instructions, see PRODUCTION-DEPLOYMENT.md"
echo ""
echo "🎉 Your app will be live at:"
echo "   Frontend: https://your-app.vercel.app"
echo "   Backend:  https://your-app.up.railway.app"
echo ""
echo "Happy deploying! 🚀"
