@echo off
title Personal Finance Dashboard
color 0A
echo.
echo ================================================
echo    Personal Finance Dashboard - Desktop App
echo ================================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

echo [2/3] Starting backend server...
start "Backend Server" cmd /c "node simple-server.js"

echo [3/3] Waiting for server to start...
timeout /t 5 /nobreak >nul 2>&1
if %errorlevel% neq 0 (
    ping 127.0.0.1 -n 6 > nul
)

cd ..

echo Starting Electron app...
npx electron .

echo.
echo Desktop app closed.
pause
