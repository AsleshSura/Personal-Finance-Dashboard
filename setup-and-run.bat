@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Personal Finance Dashboard - Setup & Run
echo ==========================================
echo.

REM Get the directory where this batch file is located
set "PROJECT_DIR=%~dp0"
echo Project directory: %PROJECT_DIR%
echo.

REM Change to project directory
cd /d "%PROJECT_DIR%"
if errorlevel 1 (
    echo ERROR: Could not change to project directory
    pause
    exit /b 1
)

echo [Step 1/4] Installing root dependencies...
if not exist "node_modules" (
    echo Installing Electron and main dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install root dependencies
        pause
        exit /b 1
    )
) else (
    echo Root dependencies already installed.
)
echo.

echo [Step 2/4] Installing backend dependencies...
cd /d "%PROJECT_DIR%backend"
if errorlevel 1 (
    echo ERROR: Could not change to backend directory
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)
echo.

REM Return to project root
cd /d "%PROJECT_DIR%"

echo [Step 3/4] Starting backend server...
start "Backend Server" cmd /k "cd /d \"%PROJECT_DIR%backend\" && node simple-server.js"

REM Wait for server to start
echo Waiting for backend server to start...
ping 127.0.0.1 -n 4 > nul

echo [Step 4/4] Starting desktop app...
npx electron .

echo.
echo Desktop app closed.
pause
