@echo off
cls
echo =====================================
echo  Professional PDF Editor - Adobe Style
echo =====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the complete build and start script
echo Starting PDF Editor...
echo This may take a moment on first run...
echo.

node run-complete.js

echo.
echo =====================================
echo Application closed.
echo =====================================
pause
