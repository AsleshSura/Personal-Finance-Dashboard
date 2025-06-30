# Personal Finance Dashboard - Quick Start
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Personal Finance Dashboard - Quick Start" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host

# Get the directory where this script is located
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Project directory: $ProjectDir" -ForegroundColor Yellow
Write-Host

# Change to project directory
Set-Location $ProjectDir

Write-Host "[1/2] Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectDir\backend'; node simple-server.js"

# Wait for server to start
Write-Host "Waiting for backend server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "[2/2] Starting desktop app..." -ForegroundColor Cyan
npx electron .

Write-Host
Write-Host "Desktop app closed." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
