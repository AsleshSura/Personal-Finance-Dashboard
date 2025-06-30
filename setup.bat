@echo off
echo =====================================================
echo   PERSONAL FINANCE DASHBOARD - COMPLETE SETUP
echo =====================================================
echo.

echo 1. Checking if MongoDB is installed...
sc query MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is installed and running!
    goto :start_app
) else (
    echo ❌ MongoDB is not installed.
    echo.
    echo 📥 INSTALLING MONGODB...
    echo Please follow these steps:
    echo.
    echo 1. Go to: https://www.mongodb.com/try/download/community
    echo 2. Download MongoDB Community Server for Windows
    echo 3. Run the installer with these settings:
    echo    - Choose "Complete" installation
    echo    - ✅ Check "Install MongoDB as a Service"
    echo    - ✅ Check "Run service as Network Service user"
    echo 4. After installation, run this script again
    echo.
    pause
    start "" "https://www.mongodb.com/try/download/community"
    exit /b
)

:start_app
echo.
echo 2. Starting Personal Finance Dashboard...
echo.

cd /d "%~dp0backend"

echo 📦 Installing dependencies...
call npm install

echo.
echo 🚀 Starting server...
echo 🌐 Frontend: Open 'frontend/index.html' in your browser
echo 📊 Backend API: http://localhost:5000
echo.

call npm start
