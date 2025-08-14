@echo off
echo.
echo ========================================
echo    PDF Editor - Starting Fixed Version
echo ========================================
echo.
echo Starting PDF Editor with working IPC handlers...
echo.

npm run start-fixed

if errorlevel 1 (
    echo.
    echo ========================================
    echo If the app didn't start, try:
    echo   npx electron dist/main/main-fixed.js --disable-gpu
    echo ========================================
    pause
)
