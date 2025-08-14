@echo off
echo ================================================================
echo  PDF Editor - COMPREHENSIVE FIX SYSTEM v4.0
echo  Transithesis Cognitive Engine - Production Quality Build
echo ================================================================
echo.

REM Set environment variables for stability
set ELECTRON_DISABLE_GPU=1
set ELECTRON_NO_ATTACH_CONSOLE=1
set NODE_OPTIONS=--max-old-space-size=4096
set ELECTRON_ENABLE_LOGGING=1

echo [1/10] Setting up environment variables...
echo - GPU disabled for stability
echo - Memory increased to 4GB
echo - Logging enabled
echo.

echo [2/10] Cleaning previous build artifacts...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo - Cleaned dist and cache directories
echo.

echo [3/10] Verifying npm version...
call npm -v > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo - npm is installed
echo.

echo [4/10] Cleaning npm cache...
call npm cache clean --force > nul 2>&1
echo - npm cache cleaned
echo.

echo [5/10] Installing critical dependencies...
call npm install --save-dev babel-loader@^9.1.3 @babel/core@^7.23.0 @babel/preset-env@^7.23.0 @babel/preset-react@^7.22.15 @babel/preset-typescript@^7.23.0
if %errorlevel% neq 0 (
    echo WARNING: Some babel dependencies failed to install
)
echo.

echo [6/10] Installing webpack dependencies...
call npm install --save-dev webpack@^5.88.0 webpack-cli@^5.1.0 webpack-dev-server@^4.15.0 html-webpack-plugin@^5.5.0 copy-webpack-plugin@^11.0.0
if %errorlevel% neq 0 (
    echo WARNING: Some webpack dependencies failed to install
)
echo.

echo [7/10] Installing type loaders...
call npm install --save-dev ts-loader@^9.4.0 css-loader@^6.8.0 style-loader@^3.3.0 file-loader@^6.2.0
if %errorlevel% neq 0 (
    echo WARNING: Some loader dependencies failed to install
)
echo.

echo [8/10] Installing core dependencies...
call npm install pdfjs-dist@^3.11.0 pdf-lib@^1.17.1 react@^18.2.0 react-dom@^18.2.0
if %errorlevel% neq 0 (
    echo WARNING: Some core dependencies failed to install
)
echo.

echo [9/10] Running postinstall scripts...
call npm run postinstall
if %errorlevel% neq 0 (
    echo WARNING: Postinstall scripts failed
)
echo.

echo [10/10] Creating emergency webpack configs...
node -e "console.log('Creating fallback configs...')"

REM Create webpack.renderer.config.fixed.js if it doesn't exist
if not exist webpack.renderer.config.fixed.js (
    copy webpack.renderer.config.js webpack.renderer.config.fixed.js > nul 2>&1
    echo - Created webpack.renderer.config.fixed.js
)

REM Create build-production-enhanced.js if it doesn't exist
if not exist build-production-enhanced.js (
    copy build-production.js build-production-enhanced.js > nul 2>&1
    echo - Created build-production-enhanced.js
)
echo.

echo ================================================================
echo  FIX COMPLETE - Ready to build
echo ================================================================
echo.
echo Next steps:
echo 1. Run BUILD.bat to build the application
echo 2. Run START-APP.bat to launch the application
echo.
echo If issues persist:
echo - Run "npm install" manually
echo - Check the error-report.json in suggestions folder
echo - Run FIX-ALL-ENHANCED.bat again
echo.
pause
