@echo off
cd /d "%~dp0"
cls
color 0A
title PDF Editor - Unified Build System v12

echo ================================================================================
echo                  PROFESSIONAL PDF EDITOR BUILD SYSTEM
echo                       Production-Quality Builder v12
echo ================================================================================
echo.

echo [BUILD] Starting unified build process...
echo.

node build-unified.js

if %ERRORLEVEL% EQU 0 (
    echo.
    color 0A
    echo ================================================================================
    echo                         BUILD SUCCESSFUL!
    echo ================================================================================
    echo.
    echo You can now launch the application:
    echo   - Double-click SMART-START.bat
    echo   - Or run: npm start
    echo.
) else (
    echo.
    color 0C
    echo ================================================================================
    echo                          BUILD FAILED
    echo ================================================================================
    echo.
    echo Check suggestions/build-error-v12.json for details
    echo.
    echo Fallback options:
    echo   1. npm install (if dependencies missing)
    echo   2. node build-emergency.js (emergency build)
    echo   3. Check the suggestions folder for logs
    echo.
)

pause
