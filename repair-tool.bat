@echo off
title PDF Editor - Repair Tool
echo ========================================
echo PDF Editor Repair & Troubleshooting Tool
echo ========================================
echo.
echo This tool will help fix common issues with the PDF Editor
echo.

:menu
echo Select an option:
echo.
echo 1. Quick Fix (Rebuild application)
echo 2. Deep Clean (Remove all cache and rebuild)
echo 3. Dependency Fix (Reinstall all packages)
echo 4. Permission Fix (Reset file permissions)
echo 5. Developer Mode (Run with debugging)
echo 6. Check System Requirements
echo 7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto quickfix
if "%choice%"=="2" goto deepclean
if "%choice%"=="3" goto depfix
if "%choice%"=="4" goto permfix
if "%choice%"=="5" goto devmode
if "%choice%"=="6" goto syscheck
if "%choice%"=="7" exit /b 0

echo Invalid choice. Please try again.
echo.
goto menu

:quickfix
echo.
echo Performing Quick Fix...
echo.

:: Clean and rebuild
if exist "dist" rmdir /s /q "dist"
call npm run build
if %errorlevel% equ 0 (
    echo Quick Fix completed successfully!
) else (
    echo Quick Fix failed. Try Deep Clean option.
)
echo.
pause
goto menu

:deepclean
echo.
echo Performing Deep Clean...
echo WARNING: This will remove all cached data and dependencies!
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo Removing node_modules...
if exist "node_modules" rmdir /s /q "node_modules"

echo Removing dist folder...
if exist "dist" rmdir /s /q "dist"

echo Removing package-lock.json...
if exist "package-lock.json" del /f package-lock.json

echo Clearing npm cache...
call npm cache clean --force

echo Reinstalling dependencies...
call npm install

echo Rebuilding application...
call npm run build

if %errorlevel% equ 0 (
    echo Deep Clean completed successfully!
) else (
    echo Deep Clean encountered errors. Please check the output above.
)
echo.
pause
goto menu

:depfix
echo.
echo Fixing Dependencies...
echo.

:: Fix potential dependency issues
call npm audit fix --force
call npm dedupe
call npm prune

echo Rebuilding application...
call npm run build

echo Dependency Fix completed!
echo.
pause
goto menu

:permfix
echo.
echo Fixing File Permissions...
echo.

:: Reset permissions (Windows)
echo Taking ownership of files...
takeown /f . /r >nul 2>&1

echo Resetting permissions...
icacls . /reset /T /Q

echo Permission Fix completed!
echo.
pause
goto menu

:devmode
echo.
echo Starting in Developer Mode...
echo.
set NODE_ENV=development
set DEBUG=*
echo Developer mode enabled. Opening with DevTools...
echo.
npm run dev
echo.
pause
goto menu

:syscheck
echo.
echo Checking System Requirements...
echo.
echo ========================================

:: Check Node.js
echo Node.js:
node --version 2>nul || echo NOT INSTALLED - Required!

:: Check npm
echo.
echo npm:
npm --version 2>nul || echo NOT INSTALLED - Required!

:: Check Python (for node-gyp)
echo.
echo Python (for native modules):
python --version 2>nul || echo Not installed (optional)

:: Check Git
echo.
echo Git:
git --version 2>nul || echo Not installed (optional)

:: Check available memory
echo.
echo System Information:
wmic OS get TotalVisibleMemorySize /value | find "="
wmic CPU get Name /value | find "="

:: Check disk space
echo.
echo Disk Space:
for /f "tokens=3" %%a in ('dir /-c ^| findstr /c:"bytes free"') do (
    set /a "gb=%%a/1073741824"
    echo Free space: !gb! GB
)

echo.
echo ========================================
echo Minimum Requirements:
echo - Node.js 14.0 or higher
echo - npm 6.0 or higher
echo - 4 GB RAM
echo - 500 MB free disk space
echo ========================================
echo.
pause
goto menu
