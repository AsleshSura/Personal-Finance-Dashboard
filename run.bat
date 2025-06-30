@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Personal Finance Dashboard - Quick Start
echo ==========================================
echo.

REM Kill any process using port 5001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo Project directory: %~dp0
echo.

REM Change to project directory
cd /d "%~dp0"

echo [1/2] Starting backend server...
start "Backend Server" cmd /k "cd /d backend && node simple-server.js"

REM Wait for server to start
echo Waiting for backend server to start...
ping 127.0.0.1 -n 4 > nul

echo [2/2] Starting desktop app...
npx electron .

echo.
echo Desktop app closed.
pause
