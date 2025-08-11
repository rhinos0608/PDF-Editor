@echo off
title Professional PDF Editor
echo ========================================
echo Professional PDF Editor - Premium Edition
echo ========================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] First time setup detected...
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

:: Check if app is built
if not exist "dist\main\main.js" (
    echo [INFO] Application not built. Building now...
    echo.
    call build-app.bat
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
)

:: Run the application
echo ========================================
echo Starting Professional PDF Editor...
echo ========================================
echo.
echo [INFO] Application is starting...
echo [INFO] The window will open shortly...
echo.
echo Press Ctrl+C to stop the application
echo.

:: Set environment variable for development mode
set NODE_ENV=production

:: Start the Electron app
npm start

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application crashed or failed to start!
    echo.
    echo Troubleshooting tips:
    echo 1. Try deleting node_modules and running again
    echo 2. Check if antivirus is blocking the app
    echo 3. Run as administrator if needed
    echo.
    pause
)
