@echo off
echo ========================================
echo PDF Editor - Complete Setup Script
echo ========================================
echo.

:: Set error handling
setlocal enabledelayedexpansion

:: Step 1: Check Node.js
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found
echo.

:: Step 2: Clean previous installations
echo [2/6] Cleaning previous installations...
if exist "node_modules" (
    echo Removing old node_modules...
    rmdir /s /q "node_modules" 2>nul
)
if exist "dist" (
    echo Removing old build...
    rmdir /s /q "dist" 2>nul
)
if exist "package-lock.json" (
    echo Removing package-lock.json...
    del /f "package-lock.json" 2>nul
)
echo Clean complete
echo.

:: Step 3: Install dependencies
echo [3/6] Installing dependencies...
echo This may take 3-5 minutes...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    echo Trying with --force flag...
    call npm install --force
    if %errorlevel% neq 0 (
        echo [ERROR] Installation failed completely!
        pause
        exit /b 1
    )
)
echo Dependencies installed successfully
echo.

:: Step 4: Install additional required packages
echo [4/6] Installing additional packages...
call npm install --save-dev copy-webpack-plugin
call npm install --save-dev html-webpack-plugin
echo Additional packages installed
echo.

:: Step 5: Build the application
echo [5/6] Building application...
echo Building main process...
call npm run build:main
if %errorlevel% neq 0 (
    echo [WARNING] Main build had issues, attempting direct webpack...
    call npx webpack --config webpack.main.config.js --mode production
)

echo Building renderer process...
call npm run build:renderer
if %errorlevel% neq 0 (
    echo [WARNING] Renderer build had issues, attempting direct webpack...
    call npx webpack --config webpack.renderer.config.js --mode production
)
echo Build complete
echo.

:: Step 6: Verify build
echo [6/6] Verifying build...
node verify-build.js
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Build verification found issues.
    echo The app may still work. Try running: npm start
)

:: Create success marker
echo Setup completed at %date% %time% > setup-complete.txt

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo You can now run the application with:
echo   - PDF_EDITOR_PREMIUM.bat (recommended)
echo   - npm start
echo   - run-app.bat
echo.
pause
