# 🚀 MONGODB INSTALLATION AND SETUP GUIDE

## The Problem: Registration Not Working ❌

Your registration is failing because **MongoDB is not installed or running** on your system. This is the most common issue with Node.js/Express applications that use MongoDB.

## ✅ Quick Solution - Install MongoDB

### Step 1: Download MongoDB Community Server
1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community?tck=docs_server)
2. Select:
   - **Version**: Latest (8.0 or 7.0)
   - **Platform**: Windows
   - **Package**: msi
3. Click **Download**

### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Choose **Complete** installation (recommended)
3. **IMPORTANT**: Select "Install MongoDB as a Service" 
4. Use default settings (Network Service user is fine)
5. **Optional but recommended**: Install MongoDB Compass (GUI tool)

### Step 3: Verify MongoDB is Running
1. Open **Services** (Windows key + R, type `services.msc`)
2. Look for **MongoDB** service
3. Make sure it's **Running** (if not, right-click → Start)

### Step 4: Test Your App
```bash
# Navigate to backend folder
cd "c:\Users\SOLID\Downloads\HC\ShipWrecked\Personal-Finance-Dashboard\backend"

# Run our test script
node quick-test.js

# If test passes, start the server
npm start
```

## 🔧 Alternative: MongoDB Atlas (Cloud Database)

If you prefer not to install MongoDB locally, use MongoDB Atlas (free tier):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster (free tier M0)
4. Get connection string
5. Update your `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/finance-dashboard
```

## 🚨 Common Issues and Solutions

### Issue 1: "MongoServerSelectionTimeoutError"
**Cause**: MongoDB service not running
**Solution**: Start MongoDB service in Windows Services

### Issue 2: "getaddrinfo ENOTFOUND localhost"
**Cause**: Network/DNS issue
**Solution**: Use `127.0.0.1` instead of `localhost`:
```
MONGODB_URI=mongodb://127.0.0.1:27017/finance-dashboard
```

### Issue 3: "Authentication failed"
**Cause**: MongoDB has authentication enabled
**Solution**: Either disable auth or create user account

### Issue 4: Port 27017 already in use
**Cause**: Another MongoDB instance running
**Solution**: Kill other MongoDB processes or use different port

## 📋 Quick Verification Commands

```bash
# Check if MongoDB service is running
sc query MongoDB

# Test MongoDB connection manually
mongosh "mongodb://localhost:27017/finance-dashboard"

# List all running services with "mongo" in name
Get-Service | Where-Object {$_.Name -like "*mongo*"}
```

## 🎯 Next Steps After MongoDB Installation

1. **Start MongoDB**: Ensure service is running
2. **Run test**: `node quick-test.js`
3. **Start backend**: `npm start`
4. **Open frontend**: Open `frontend/index.html` in browser
5. **Test registration**: Try creating a new account

## 💡 Pro Tips

1. **Development**: Install MongoDB locally for faster development
2. **Production**: Use MongoDB Atlas for production deployments
3. **Backup**: Atlas provides automatic backups
4. **Monitoring**: Use MongoDB Compass to view your data
5. **Security**: Never expose MongoDB without authentication in production

---

**If you're still having issues after installing MongoDB, the problem might be:**
- Windows Firewall blocking MongoDB
- Antivirus software interfering
- Permission issues with data directory
- Port conflicts

Run `node quick-test.js` to get specific error messages and troubleshoot accordingly.
