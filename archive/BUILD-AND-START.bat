@echo off
echo ====================================
echo Professional PDF Editor - Master Build
echo ====================================
echo.

REM Run the master build script
node build-master-v3.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Build successful! Starting app...
echo ====================================
echo.

REM Start the application
npm start

pause
