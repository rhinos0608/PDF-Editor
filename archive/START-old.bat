@echo off
echo ========================================
echo Professional PDF Editor - Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dist/main.js exists
if not exist dist\main.js (
    echo Build files not found. Running build...
    echo.
    call node build-production.js
    echo.
)

REM Verify build
echo Verifying build...
node verify-build.js
echo.

REM Check if build was successful
if exist dist\main.js (
    echo Starting PDF Editor...
    echo.
    npm start
) else (
    echo Build verification failed!
    echo Attempting emergency build...
    
    REM Emergency build
    if not exist dist mkdir dist
    copy src\main.js dist\main.js >nul 2>&1
    copy src\preload.js dist\preload.js >nul 2>&1
    
    if exist public\index.html (
        copy public\index.html dist\index.html >nul 2>&1
    )
    
    echo Emergency build complete. Starting app...
    npm start
)
