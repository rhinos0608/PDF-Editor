# Professional PDF Editor - Complete Production Build Script
# This script performs a clean build and ensures the application is production-ready

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Professional PDF Editor - Production Build" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 16 or higher" -ForegroundColor Red
    exit 1
}

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow

# Clean previous builds
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Removed dist folder" -ForegroundColor Green
}

if (Test-Path "release") {
    Remove-Item -Recurse -Force "release"
    Write-Host "✓ Removed release folder" -ForegroundColor Green
}

# Clean npm cache (optional but recommended for clean build)
Write-Host ""
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "✓ npm cache cleaned" -ForegroundColor Green

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Installing additional type definitions..." -ForegroundColor Yellow
npm install --save-dev @types/react-color 2>$null
Write-Host "✓ Type definitions installed" -ForegroundColor Green

Write-Host ""
Write-Host "Creating required directories..." -ForegroundColor Yellow

# Ensure required directories exist
$directories = @("dist", "dist/main", "dist/renderer", "public", "src/types")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Created $dir" -ForegroundColor Green
    }
}

# Create default icon if it doesn't exist
if (!(Test-Path "public/icon.png")) {
    Write-Host ""
    Write-Host "Creating default icon..." -ForegroundColor Yellow
    $iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    [System.IO.File]::WriteAllBytes("public/icon.png", [System.Convert]::FromBase64String($iconBase64))
    Write-Host "✓ Default icon created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Building main process..." -ForegroundColor Yellow
npm run build:main
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Main process build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Main process built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Building renderer process..." -ForegroundColor Yellow
npm run build:renderer
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Renderer process build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Renderer process built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Verifying build output..." -ForegroundColor Yellow

# Check if build outputs exist
$requiredFiles = @(
    "dist/main/main.js",
    "dist/main/preload.js",
    "dist/renderer/index.html"
)

$buildValid = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
        $buildValid = $false
    }
}

if (!$buildValid) {
    Write-Host ""
    Write-Host "✗ Build verification failed. Some required files are missing." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Production Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. To run the application: npm start" -ForegroundColor White
Write-Host "2. To create installer: npm run dist" -ForegroundColor White
Write-Host "3. To run in development: npm run dev" -ForegroundColor White
Write-Host ""

# Ask if user wants to start the application
$response = Read-Host "Would you like to start the application now? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "Starting Professional PDF Editor..." -ForegroundColor Cyan
    npm start
}
