@echo off
cls
echo ╔══════════════════════════════════════════════════════════╗
echo ║         PROFESSIONAL PDF EDITOR - LAUNCHER              ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Check if dist folder exists
if not exist dist (
    echo ❌ Error: Build directory not found!
    echo.
    echo Please build the application first:
    echo   Run: build-production-master.bat
    echo.
    pause
    exit /b 1
)

:: Check for main.js
if not exist dist\main.js (
    echo ❌ Error: Main process file not found!
    echo.
    echo The application is not properly built.
    echo Please run: build-production-master.bat
    echo.
    pause
    exit /b 1
)

:: Check for index.html
if not exist dist\index.html (
    echo ❌ Error: Renderer file not found!
    echo.
    echo The application is not properly built.
    echo Please run: build-production-master.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Build verified successfully
echo.
echo Starting Professional PDF Editor...
echo ══════════════════════════════════════════
echo.

:: Set production environment
set NODE_ENV=production

:: Start the application
npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Application exited with an error.
    echo.
    pause
)
