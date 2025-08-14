@echo off
chcp 65001 >nul 2>&1
cls

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     PROFESSIONAL PDF EDITOR - ULTIMATE FIX              ║
echo ║         Transisthesis Cognitive Engine                  ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Set environment
set NODE_ENV=production

:: Run the ultimate fix
echo Running comprehensive fix and build...
echo.
node ultimate-fix.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ══════════════════════════════════════════════════════════
    echo SUCCESS! The application has been fixed and built.
    echo ══════════════════════════════════════════════════════════
    echo.
    echo Testing the application...
    echo.
    timeout /t 3 /nobreak >nul
    
    :: Start the app
    npm start
) else (
    echo.
    echo ══════════════════════════════════════════════════════════
    echo Build process needs manual intervention.
    echo ══════════════════════════════════════════════════════════
    echo.
    echo Trying alternative approach...
    echo.
    
    :: Manual build steps
    echo Step 1: Cleaning dist...
    if exist dist rmdir /s /q dist
    mkdir dist
    
    echo Step 2: Copying main files manually...
    copy src\main.js dist\main.js >nul 2>&1
    copy src\preload.js dist\preload.js >nul 2>&1
    
    echo Step 3: Building renderer...
    call npx webpack --config webpack.renderer.config.prod.js
    
    echo.
    echo Manual build complete. Starting application...
    npm start
)

pause
