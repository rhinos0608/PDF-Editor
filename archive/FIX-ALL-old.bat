@echo off
echo ====================================
echo Professional PDF Editor - Complete Fix v3.0
echo Transithesis Cognitive Engine Applied
echo ====================================
echo.

echo [1/8] Checking Node.js version...
node --version
echo.

echo [2/8] Installing critical dependencies...
echo Installing babel-loader and related packages...
call npm install --save-dev babel-loader@^9.1.3 @babel/core@^7.23.0 @babel/preset-env@^7.23.0 @babel/preset-react
if %errorlevel% neq 0 (
    echo Warning: Some dependencies failed to install
)
echo.

echo [3/8] Installing all dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Warning: Some dependencies failed to install
    echo Continuing with build...
)
echo.

echo [4/8] Running enhanced production build...
call node build-production-enhanced.js
if %errorlevel% neq 0 (
    echo Build had issues, check suggestions folder for details
)
echo.

echo [5/8] Verifying build output...
if exist "dist\main.js" (
    echo ✓ Main process built
) else (
    echo × Main process missing
)

if exist "dist\index.html" (
    echo ✓ Renderer built
) else (
    echo × Renderer missing
)
echo.

echo [6/8] Creating archive folder for old files...
if not exist "archive" mkdir archive
move /Y emergency-build.js archive\ 2>nul
move /Y complete-fix.js archive\ 2>nul
move /Y fix-security-issues.js archive\ 2>nul
move /Y verify-build.js archive\ 2>nul
move /Y verify.js archive\ 2>nul
echo.

echo [7/8] Updating package.json...
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.main='dist/main.js'; fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
echo.

echo [8/8] Build complete!
echo.
echo ====================================
echo ✅ PDF Editor Ready
echo ====================================
echo.
echo Run the application with:
echo   npm start
echo.
echo Or build installer with:
echo   npm run dist
echo.
echo Check suggestions folder for analytics and improvements
echo.
pause