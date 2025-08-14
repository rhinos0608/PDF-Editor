@echo off
cls
title Professional PDF Editor - Launcher
color 0A

echo ================================================
echo     Professional PDF Editor - Adobe Style
echo            Quick Launch System
echo ================================================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js detected
echo.

REM Option for user
echo Choose an option:
echo -----------------
echo 1. Quick Fix and Run (Recommended)
echo 2. Full Build and Run
echo 3. Just Run (if already built)
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto quickfix
if "%choice%"=="2" goto fullbuild
if "%choice%"=="3" goto justrun
if "%choice%"=="4" goto end

:quickfix
echo.
echo [RUNNING] Quick Fix Script...
echo =============================
node quick-fix.js
goto end

:fullbuild
echo.
echo [BUILDING] Full Build...
echo ========================
call npm run build:renderer
call npm run build:main
echo.
echo [STARTING] Application...
echo =========================
npx electron dist/main/main.js
goto end

:justrun
echo.
echo [STARTING] Application...
echo =========================
if exist "dist\main\main.js" (
    npx electron dist/main/main.js
) else (
    echo [WARNING] Build files not found, running default...
    npx electron .
)
goto end

:end
echo.
echo ================================================
echo     Thank you for using PDF Editor!
echo ================================================
pause
