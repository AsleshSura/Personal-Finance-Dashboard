@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Personal Finance Dashboard - Quick Start
if not "%1"=="" echo (Launched by: %1)
echo ==========================================
echo.

echo Checking for processes using port 5001...
REM Find and kill ANY process using port 5001 (all states)
set PORT_FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    set PORT_FOUND=1
    echo (Automatic fix) Closing background process using port 5001: PID=%%a
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 >nul
)
if !PORT_FOUND! == 0 (
    echo Port 5001 is free. Starting the app...
) else (
    echo Waiting for port 5001 to be released...
    timeout /t 2 >nul
)

echo Double-checking port 5001 is free...
REM Double-check port is free
set PORT_STILL_USED=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    set PORT_STILL_USED=1
    echo Sorry! Another program is still using port 5001 (PID %%a).
    echo Please close any other Personal Finance Dashboard windows or restart your computer.
    echo If this keeps happening, contact support.
)
if !PORT_STILL_USED! == 1 (
    pause
    exit /b 1
)

echo Project directory: %~dp0
echo.

REM Change to project directory
cd /d "%~dp0"
if errorlevel 1 (
    echo ERROR: Could not change to project directory.
    pause
    exit /b 1
)

echo [1/2] Starting backend server...
start "Backend Server" cmd /k "cd /d backend && node simple-server.js"

REM Wait for server to start
echo Waiting for backend server to start...
ping 127.0.0.1 -n 4 > nul

echo [2/2] Starting desktop app...
npx electron .
if errorlevel 1 (
    echo ERROR: Could not start Electron app. Is Electron installed?
    pause
    exit /b 1
)

echo.
echo Desktop app closed.
pause
