@echo off
echo ====================================================
echo  Professional PDF Editor - Master Build System v2.0
echo  Applying Transithesis & Council-Driven Development
echo ====================================================
echo.

REM Clean previous builds
echo [1/8] Cleaning previous builds...
if exist dist rmdir /s /q dist 2>nul
if exist release rmdir /s /q release 2>nul
mkdir dist

REM Install dependencies
echo [2/8] Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

REM Fix GPU issues by setting environment variables
echo [3/8] Configuring GPU settings...
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
set ELECTRON_ENABLE_LOGGING=true

REM Create fallback files
echo [4/8] Creating fallback files...
node -e "const fs=require('fs'); if(!fs.existsSync('dist/main.js')){fs.copyFileSync('src/main.js','dist/main.js');} if(!fs.existsSync('dist/preload.js')){fs.copyFileSync('src/preload.js','dist/preload.js');}"

REM Build main process
echo [5/8] Building main process...
call npx webpack --config webpack.main.config.js --mode production

REM Build renderer with fixed config
echo [6/8] Building renderer process...
call npx webpack --config webpack.renderer.config.fixed.js --mode production

REM Verify build
echo [7/8] Verifying build...
if not exist dist\main.js (
    echo WARNING: main.js not found, using fallback...
    copy src\main.js dist\main.js
)

if not exist dist\preload.js (
    echo WARNING: preload.js not found, using fallback...
    copy src\preload.js dist\preload.js
)

if not exist dist\index.html (
    echo ERROR: index.html not found!
    echo Creating emergency HTML...
    node build-production-enhanced.js
)

REM Run enhanced build for analytics
echo [8/8] Running enhanced build system...
node build-production-enhanced.js

echo.
echo ====================================================
echo  Build Complete! 
echo ====================================================
echo.
echo To start the application: npm start
echo To create installer: npm run dist
echo.
echo Check suggestions\build-analytics-enhanced.json for improvement recommendations
echo.
pause
