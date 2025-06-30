# Personal Finance Dashboard - Complete Setup Script
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   PERSONAL FINANCE DASHBOARD - COMPLETE SETUP" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is installed
Write-Host "1. Checking if MongoDB is installed..." -ForegroundColor Yellow

try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction Stop
    if ($mongoService.Status -eq "Running") {
        Write-Host "✅ MongoDB is installed and running!" -ForegroundColor Green
        $mongoInstalled = $true
    } else {
        Write-Host "⚠️  MongoDB is installed but not running. Starting..." -ForegroundColor Yellow
        Start-Service -Name "MongoDB"
        Write-Host "✅ MongoDB started!" -ForegroundColor Green
        $mongoInstalled = $true
    }
} catch {
    Write-Host "❌ MongoDB is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 INSTALLING MONGODB..." -ForegroundColor Yellow
    Write-Host "Please follow these steps:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Go to: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Download MongoDB Community Server for Windows" -ForegroundColor White
    Write-Host "3. Run the installer with these settings:" -ForegroundColor White
    Write-Host "   - Choose 'Complete' installation" -ForegroundColor White
    Write-Host "   - ✅ Check 'Install MongoDB as a Service'" -ForegroundColor White
    Write-Host "   - ✅ Check 'Run service as Network Service user'" -ForegroundColor White
    Write-Host "4. After installation, run this script again" -ForegroundColor White
    Write-Host ""
    
    # Open MongoDB download page
    Start-Process "https://www.mongodb.com/try/download/community"
    
    Read-Host "Press Enter after installing MongoDB to continue"
    exit
}

if ($mongoInstalled) {
    Write-Host ""
    Write-Host "2. Starting Personal Finance Dashboard..." -ForegroundColor Yellow
    Write-Host ""
    
    # Change to backend directory
    Set-Location "$PSScriptRoot\backend"
    
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    
    Write-Host ""
    Write-Host "🚀 Starting server..." -ForegroundColor Green
    Write-Host "🌐 Frontend: Open 'frontend/index.html' in your browser" -ForegroundColor Yellow
    Write-Host "📊 Backend API: http://localhost:5000" -ForegroundColor Yellow
    Write-Host ""
    
    # Start the server
    npm start
}
