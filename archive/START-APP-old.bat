@echo off
echo ====================================
echo Professional PDF Editor - Start
echo ====================================
echo.

REM Disable GPU to prevent crashes
set ELECTRON_DISABLE_GPU=1
set ELECTRON_ENABLE_LOGGING=1

REM Check if dist folder exists
if not exist "dist\main.js" (
    echo ⚠️  Build not found. Running build first...
    call FIX-ALL.bat
)

echo Starting PDF Editor...
echo.

REM Start the application
npm start

if %errorlevel% neq 0 (
    echo.
    echo ====================================
    echo ⚠️  Application crashed
    echo ====================================
    echo.
    echo Trying safe mode...
    npm run start:safe
)

pause