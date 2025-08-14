@echo off
cd /d "%~dp0"
cls
color 0E
title Professional PDF Editor - Master Launcher

echo ================================================================================
echo                     PROFESSIONAL PDF EDITOR v4.0
echo                    Adobe-Quality PDF Editing Solution
echo ================================================================================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [CRITICAL ERROR] Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: LTS (Latest Stable)
    echo.
    pause
    exit /b 1
)

REM Display system info
echo [SYSTEM INFO]
echo Node Version: 
node -v
echo NPM Version:
call npm -v 2>nul || echo Not available
echo.
echo ================================================================================

REM Check for dependencies
if not exist "node_modules\electron" (
    echo [NOTICE] Electron not found. Installing dependencies...
    echo This may take a few minutes on first run...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo [ERROR] Failed to install dependencies
        echo Please check your internet connection and try again
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed
    echo.
)

REM Run the comprehensive launcher
echo [STARTING] Launching PDF Editor Professional...
echo ================================================================================
echo.

node launcher-v4.js

set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% NEQ 0 (
    echo.
    color 0C
    echo ================================================================================
    echo [APPLICATION ERROR] Exit code: %EXIT_CODE%
    echo.
    echo Troubleshooting Options:
    echo   1. Run this launcher again (temporary issues often resolve)
    echo   2. Delete 'dist' folder and try again
    echo   3. Run 'npm run clean' then try again
    echo   4. Check the suggestions folder for detailed diagnostics
    echo.
    echo For emergency mode: Run 'node build-emergency.js' then try again
    echo ================================================================================
) else (
    echo.
    color 0A
    echo ================================================================================
    echo [SUCCESS] Application closed normally
    echo ================================================================================
)

echo.
pause
