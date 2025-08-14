@echo off
cd /d "%~dp0"
title PDF Editor - GPU Fix Launcher

echo ========================================
echo  Professional PDF Editor - GPU Fix v13
echo ========================================
echo.

REM Disable GPU to fix WebGL/GLES errors
set ELECTRON_DISABLE_GPU=1
set ELECTRON_ENABLE_LOGGING=1
set ELECTRON_NO_SANDBOX=1
set ELECTRON_FORCE_SOFTWARE_RENDERING=1

echo [1/3] Setting safe mode environment...
echo   - GPU acceleration: DISABLED
echo   - Software rendering: ENABLED
echo   - Sandbox: DISABLED
echo.

echo [2/3] Running diagnostic and fix...
node fix-gpu-and-launch.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo  Automatic launch failed. Trying fallback...
    echo ========================================
    echo.
    
    REM Fallback 1: Direct electron with all safety flags
    if exist "node_modules\.bin\electron.cmd" (
        echo Trying direct Electron launch...
        node_modules\.bin\electron.cmd dist\main\main.js --disable-gpu --disable-software-rasterizer --no-sandbox
    ) else (
        REM Fallback 2: NPX with safety flags
        echo Trying NPX launch...
        npx electron dist\main\main.js --disable-gpu --no-sandbox
    )
    
    if errorlevel 1 (
        REM Fallback 3: npm start with safe mode
        echo.
        echo Last resort: npm start in safe mode...
        npm run start:safe
    )
)

echo.
echo ========================================
echo  If the app still doesn't work:
echo  1. Run as Administrator
echo  2. Update graphics drivers
echo  3. Try: npm run build:emergency
echo ========================================
pause
