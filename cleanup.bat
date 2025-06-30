@echo off
echo Cleaning up temporary files...

cd /d "%~dp0backend"

echo Removing test files...
if exist test-mongodb.js del test-mongodb.js
if exist quick-test.js del quick-test.js

echo ✅ Cleanup complete!
echo.
echo Your Personal Finance Dashboard is ready!
echo Run 'setup.bat' to get started.
pause
