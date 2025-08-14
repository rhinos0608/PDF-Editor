@echo off
echo ================================================================
echo  PDF Editor - MASTER BUILD ORCHESTRATOR v4.0
echo  Transithesis Cognitive Engine - Production Pipeline
echo ================================================================
echo.
echo This will perform a complete rebuild of the application.
echo Press Ctrl+C to cancel, or
pause

cls
echo ================================================================
echo  PHASE 1: ENVIRONMENT PREPARATION
echo ================================================================
echo.

REM Set all critical environment variables
set ELECTRON_DISABLE_GPU=1
set ELECTRON_ENABLE_LOGGING=1
set NODE_OPTIONS=--max-old-space-size=4096
set ELECTRON_NO_ATTACH_CONSOLE=1
set ELECTRON_DISABLE_SANDBOX=1
set NODE_ENV=production

echo [1.1] Environment variables configured
echo [1.2] GPU acceleration disabled
echo [1.3] Memory limit set to 4GB
echo.

echo ================================================================
echo  PHASE 2: CLEANUP
echo ================================================================
echo.

echo [2.1] Removing old build artifacts...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo [2.2] Cleanup complete
echo.

echo ================================================================
echo  PHASE 3: DEPENDENCY VERIFICATION
echo ================================================================
echo.

echo [3.1] Checking npm installation...
call npm -v > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [3.2] Clearing npm cache...
call npm cache clean --force > nul 2>&1

echo [3.3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Some dependencies failed to install
    echo [3.4] Attempting to fix missing dependencies...
    call npm install babel-loader@^9.1.3 --save-dev
)
echo.

echo ================================================================
echo  PHASE 4: BUILDING APPLICATION
echo ================================================================
echo.

echo [4.1] Running enhanced build system...
call node build-production-enhanced-v4.js
if %errorlevel% neq 0 (
    echo.
    echo [4.2] Build failed. Attempting recovery build...
    call node build-production-enhanced-v4.js --emergency
    if %errorlevel% neq 0 (
        echo.
        echo ================================================================
        echo  BUILD FAILED
        echo ================================================================
        echo.
        echo Please check:
        echo 1. suggestions/error-report.json for details
        echo 2. Run FIX-ALL-ENHANCED.bat
        echo 3. Check Node.js version (should be 16+)
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ================================================================
echo  PHASE 5: VERIFICATION
echo ================================================================
echo.

set BUILD_SUCCESS=1

echo [5.1] Checking main process...
if exist dist\main.js (
    echo       ✓ Main process built successfully
) else (
    echo       ✗ Main process missing
    set BUILD_SUCCESS=0
)

echo [5.2] Checking renderer...
if exist dist\renderer\index.html (
    echo       ✓ Renderer built successfully
) else (
    if exist dist\index.html (
        echo       ✓ Renderer built (alternate location)
    ) else (
        echo       ✗ Renderer missing
        set BUILD_SUCCESS=0
    )
)

echo [5.3] Checking package.json...
if exist dist\package.json (
    echo       ✓ Package manifest present
) else (
    echo       ~ Package manifest missing (creating...)
    echo {"name":"pdf-editor","version":"1.0.0","main":"main.js"} > dist\package.json
)

echo.
if %BUILD_SUCCESS%==1 (
    echo ================================================================
    echo  ✅ BUILD SUCCESSFUL
    echo ================================================================
    echo.
    echo The application has been built successfully!
    echo.
    echo Next steps:
    echo 1. Run START-APP-ENHANCED.bat to launch the application
    echo 2. Or run 'npm start' from the command line
    echo 3. Check dist folder for build output
    echo.
    echo Build artifacts location: %cd%\dist
    echo.
) else (
    echo ================================================================
    echo  ⚠️ BUILD COMPLETED WITH WARNINGS
    echo ================================================================
    echo.
    echo The build completed but some components may be missing.
    echo You can still try to run the application.
    echo.
    echo Recommended actions:
    echo 1. Run FIX-ALL-ENHANCED.bat
    echo 2. Check suggestions/error-report.json
    echo 3. Try START-APP-ENHANCED.bat anyway
    echo.
)

REM Create a build timestamp
echo Build completed at %date% %time% > dist\build-info.txt
echo Version: 4.0.0 >> dist\build-info.txt
echo Mode: Production >> dist\build-info.txt

pause
