@echo off
cls
echo ╔════════════════════════════════════════╗
echo ║   PROFESSIONAL PDF EDITOR - SMART BUILD ║
echo ║         Transisthesis Framework         ║
echo ╚════════════════════════════════════════╝
echo.

:: Set environment
set NODE_ENV=production

:: Run the smart build script
echo Starting intelligent build process...
echo.
node smart-build.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ════════════════════════════════════════
    echo ✨ BUILD SUCCESSFUL! ✨
    echo ════════════════════════════════════════
    echo.
    echo Next steps:
    echo   1. Test: npm start
    echo   2. Package: npm run dist
    echo.
) else (
    echo.
    echo ════════════════════════════════════════
    echo ❌ BUILD FAILED
    echo ════════════════════════════════════════
    echo.
    echo Please review the errors above.
    echo.
)

pause
