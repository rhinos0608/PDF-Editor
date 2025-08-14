@echo off
cls
color 0A
title PDF Editor Professional - Launcher

echo ================================================================================
echo                        PDF EDITOR PROFESSIONAL v3.0
echo                      Adobe-Quality PDF Editing Solution
echo ================================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Display Node version
echo [INFO] System Information:
node -v
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] Dependencies not installed
    echo [INFO] Installing dependencies... This may take a few minutes...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully
    echo.
)

REM Run the comprehensive launcher
echo [INFO] Starting PDF Editor...
echo ================================================================================
echo.

node launcher-v3.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ================================================================================
    echo [ERROR] Application failed to start
    echo.
    echo Troubleshooting steps:
    echo   1. Check the error messages above
    echo   2. Try running: npm run build
    echo   3. Then run this launcher again
    echo.
    echo For emergency mode, run: build-emergency.js
    echo ================================================================================
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo [INFO] Application closed
echo ================================================================================
pause
