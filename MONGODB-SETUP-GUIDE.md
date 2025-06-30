# 🚀 MongoDB Setup Guide

## Quick MongoDB Installation

### Step 1: Download & Install
1. Go to [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Download for Windows
3. Run installer with these settings:
   - Choose **Complete** installation
   - ✅ **Install MongoDB as a Service**
   - ✅ **Run service as Network Service user**

### Step 2: Verify Installation
```bash
# Check if MongoDB service is running
sc query MongoDB

# Test connection
mongosh "mongodb://localhost:27017"
```

### Step 3: Start Your App
```bash
cd backend
npm install
npm start
```

## Alternative: MongoDB Atlas (Cloud)
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster (free tier)
3. Get connection string
4. Update `MONGODB_URI` in `.env` file

## Common Issues

### Connection Error
**Problem**: `MongoServerSelectionTimeoutError`  
**Solution**: Start MongoDB service or use `127.0.0.1` instead of `localhost`

### Port Conflict
**Problem**: Port 27017 in use  
**Solution**: Stop other MongoDB instances or change port

---
**Need help?** Check the main README.md for detailed setup instructions.
