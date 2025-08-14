@echo off
echo Building PDF Editor...
node build-master-v5.js
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! Launching application...
    timeout /t 2 /nobreak >nul
    node launcher-v4.js
) else (
    echo.
    echo Build failed. Please check errors above.
    pause
)
