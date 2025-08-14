@echo off
cls
echo ========================================
echo PDF EDITOR - COMPLETE BUILD TEST
echo ========================================
echo.
echo This will perform a complete production build
echo with all fixes applied.
echo.
echo ========================================
echo.

:: Clean everything first
echo Step 1: Cleaning previous builds...
if exist dist rmdir /s /q dist
echo Done.
echo.

:: Build main process
echo Step 2: Building main process...
call npx webpack --config webpack.main.config.js --mode production
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Main process build failed
    echo ========================================
    echo Check the errors above
    pause
    exit /b 1
)
echo Main process built successfully.
echo.

:: Build renderer
echo Step 3: Building renderer process...
call npx webpack --config webpack.renderer.config.prod.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Renderer build failed  
    echo ========================================
    echo Check the errors above
    pause
    exit /b 1
)
echo Renderer process built successfully.
echo.

:: Verify all files
echo Step 4: Verifying build output...
echo.

set ALL_OK=true

if exist dist\main.js (
    echo   [SUCCESS] Main process bundle created
) else (
    echo   [MISSING] dist\main.js
    set ALL_OK=false
)

if exist dist\preload.js (
    echo   [SUCCESS] Preload script created
) else (
    echo   [MISSING] dist\preload.js
    set ALL_OK=false
)

if exist dist\app.bundle.js (
    echo   [SUCCESS] Application bundle created
) else (
    echo   [MISSING] dist\app.bundle.js
    set ALL_OK=false
)

if exist dist\vendor.bundle.js (
    echo   [SUCCESS] Vendor bundle created
) else (
    echo   [MISSING] dist\vendor.bundle.js
    set ALL_OK=false
)

if exist dist\index.html (
    echo   [SUCCESS] HTML entry point created
) else (
    echo   [MISSING] dist\index.html
    set ALL_OK=false
)

echo.
echo ========================================
if "%ALL_OK%"=="true" (
    echo BUILD SUCCESSFUL - ALL FILES CREATED!
    echo ========================================
    echo.
    echo Your PDF Editor has been built successfully!
    echo All compilation errors have been fixed.
    echo.
    echo You can now:
    echo   1. Run the application: npm start
    echo   2. Create installer: npm run dist
    echo   3. Test in development: npm run dev
) else (
    echo BUILD INCOMPLETE - SOME FILES MISSING
    echo ========================================
    echo.
    echo Check the missing files above.
)
echo.
pause
