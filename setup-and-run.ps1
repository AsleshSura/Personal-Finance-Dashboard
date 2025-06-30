# Personal Finance Dashboard - Setup and Run Script
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Personal Finance Dashboard - Setup & Run" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host

# Get the directory where this script is located
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Project directory: $ProjectDir" -ForegroundColor Yellow
Write-Host

# Change to project directory
Set-Location $ProjectDir

Write-Host "[Step 1/4] Installing root dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Electron and main dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install root dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Root dependencies already installed." -ForegroundColor Green
}
Write-Host

Write-Host "[Step 2/4] Installing backend dependencies..." -ForegroundColor Cyan
Set-Location "$ProjectDir\backend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Backend dependencies already installed." -ForegroundColor Green
}
Write-Host

# Return to project root
Set-Location $ProjectDir

Write-Host "[Step 3/4] Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectDir\backend'; node simple-server.js"

# Wait for server to start
Write-Host "Waiting for backend server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "[Step 4/4] Starting desktop app..." -ForegroundColor Cyan
npx electron .

Write-Host
Write-Host "Desktop app closed." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
