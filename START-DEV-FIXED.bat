@echo off
title Professional PDF Editor - Development Mode
echo ========================================
echo  Professional PDF Editor - Dev Mode
echo ========================================
echo.

echo 🧹 Cleaning up old processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq webpack*" 2>nul

echo.
echo 🔧 Building main process...
call npm run build:main
if errorlevel 1 (
    echo ❌ Main process build failed
    pause
    exit /b 1
)

echo.
echo 🎨 Starting renderer dev server...
start "Webpack Dev Server" cmd /k "npm run dev:renderer"

echo.
echo ⏳ Waiting for dev server to start...
timeout /t 5 /nobreak > nul

echo.
echo ⚡ Starting Electron app...
set NODE_ENV=development
set ELECTRON_IS_DEV=1
start "PDF Editor" cmd /k "npx electron ."

echo.
echo ✅ Development environment started!
echo 📝 Edit mode: Press Edit button and click on PDF text
echo 🔧 HMR: Changes will auto-reload in renderer
echo 🛑 Close all windows to stop
echo.
pause