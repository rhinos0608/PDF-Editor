@echo off
echo.
echo ========================================
echo    PDF Editor - Verify and Run
echo ========================================
echo.
echo Checking setup...
echo.

node verify-setup.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo Setup verification failed!
    echo Please fix the issues above and try again.
    echo ========================================
    pause
    exit /b 1
)

echo.
echo Setup verified successfully!
echo Starting PDF Editor...
echo.

npm run start-dev

pause
