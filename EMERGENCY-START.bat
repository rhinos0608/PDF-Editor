@echo off
cd /d "%~dp0"
cls
color 0A
title PDF Editor - Emergency Launch

echo ================================================================================
echo                        PDF EDITOR EMERGENCY LAUNCHER
echo                         Forcing Application Start
echo ================================================================================
echo.

echo [EMERGENCY] Using direct Electron invocation...
echo.

REM Try the emergency launcher
node emergency-launcher.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    color 0E
    echo ================================================================================
    echo [FALLBACK] Trying direct npx electron...
    echo ================================================================================
    
    npx electron dist/main/main.js
    
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo ================================================================================
        echo [CRITICAL] All methods failed!
        echo.
        echo Manual steps required:
        echo   1. Run: npx electron dist\main\main.js
        echo   2. Or run: npm start
        echo   3. Or rebuild: node build-master-v5.js
        echo ================================================================================
    )
)

pause
