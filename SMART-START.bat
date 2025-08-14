@echo off
cd /d "%~dp0"
cls
color 0B
title PDF Editor - Smart Launcher v12

echo ================================================================================
echo                     PROFESSIONAL PDF EDITOR v12.0
echo                     Intelligent Launch System with AI Enhancement
echo ================================================================================
echo.

echo [AI SYSTEM] Initializing Transithesis Framework...
echo.

REM Use the new fixed launcher with comprehensive diagnostics
node launch-fixed.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    color 0E
    echo ================================================================================
    echo [FALLBACK] Attempting emergency recovery...
    echo ================================================================================
    
    REM Try emergency launcher as backup
    if exist emergency-launcher.js (
        node emergency-launcher.js
    ) else (
        echo [WARNING] Emergency launcher not found, trying direct launch...
        npx electron dist\main\main.js
    )
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        color 0C
        echo ================================================================================
        echo [MANUAL MODE] Please check suggestions/launch-report-v12.json for details
        echo.
        echo Quick fixes to try:
        echo   1. npm install
        echo   2. npm run build
        echo   3. npm start
        echo ================================================================================
    )
)

echo.
pause
