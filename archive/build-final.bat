@echo off
cls
echo ========================================
echo PROFESSIONAL PDF EDITOR - FINAL BUILD
echo ========================================
echo.

:: Set environment
set NODE_ENV=production

:: Step 1: Clean dist folder
echo [1/4] Cleaning dist folder...
if exist dist rmdir /s /q dist
echo Done.
echo.

:: Step 2: Build main process
echo [2/4] Building main process...
call npx webpack --config webpack.main.config.js --mode production --stats-error-details
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Main process build failed
    pause
    exit /b 1
)
echo Done.
echo.

:: Step 3: Build renderer with production config
echo [3/4] Building renderer process...
call npx webpack --config webpack.renderer.config.prod.js --stats-error-details
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Renderer build failed
    pause
    exit /b 1
)
echo Done.
echo.

:: Step 4: Verify output
echo [4/4] Verifying build output...
echo.
set SUCCESS=true

if exist dist\main.js (
    echo   [OK] Main process bundle
) else (
    echo   [FAIL] Main process bundle missing
    set SUCCESS=false
)

if exist dist\preload.js (
    echo   [OK] Preload script
) else (
    echo   [FAIL] Preload script missing
    set SUCCESS=false
)

if exist dist\app.bundle.js (
    echo   [OK] Application bundle
) else (
    echo   [FAIL] Application bundle missing
    set SUCCESS=false
)

if exist dist\vendor.bundle.js (
    echo   [OK] Vendor bundle
) else (
    echo   [FAIL] Vendor bundle missing
    set SUCCESS=false
)

if exist dist\index.html (
    echo   [OK] HTML entry point
) else (
    echo   [FAIL] HTML entry point missing
    set SUCCESS=false
)

if exist dist\pdf.worker.min.js (
    echo   [OK] PDF.js worker
) else (
    echo   [FAIL] PDF.js worker missing
    set SUCCESS=false
)

echo.
echo ========================================
if "%SUCCESS%"=="true" (
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Application built successfully!
    echo.
    echo Next steps:
    echo   1. Test the app: npm start
    echo   2. Create installer: npm run dist
) else (
    echo BUILD INCOMPLETE
    echo ========================================
    echo.
    echo Some files are missing. Check the errors above.
)
echo.
pause
