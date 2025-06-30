@echo off
echo Starting Personal Finance Dashboard in Browser...
echo.

cd backend
echo Starting server...
start "Backend Server" cmd /k "node simple-server.js"

echo Waiting for server...
ping 127.0.0.1 -n 4 > nul

echo Opening browser...
start http://localhost:5001

echo.
echo Server is running. Close the server window to stop.
pause
