@echo off
echo.
echo ========================================
echo    PDF Editor - Development Mode
echo ========================================
echo.
echo Starting PDF Editor with development configuration...
echo.

node run-dev.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo If the app didn't start, try:
    echo   1. npm run build (to build the files)
    echo   2. Then run this script again
    echo ========================================
    pause
)
