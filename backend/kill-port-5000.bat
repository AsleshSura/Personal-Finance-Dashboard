@echo off
echo Checking for processes using port 5000...
netstat -ano | findstr :5000

for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000') do (
    echo Killing process %%i...
    taskkill /f /pid %%i
)

echo Port 5000 should now be free!
pause
