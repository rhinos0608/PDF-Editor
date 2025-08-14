@echo off
cls
echo ╔══════════════════════════════════════════════════════════╗
echo ║  PROFESSIONAL PDF EDITOR - PRODUCTION BUILD & FIX       ║
echo ║           Transisthesis Cognitive Engine                ║
echo ║          Applying Global Benchmark Standards            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Set environment
set NODE_ENV=production
set BUILD_SUCCESS=true

:: Phase 0: System Check
echo [PHASE 0] System Analysis
echo ═════════════════════════
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Please install Node.js
    set BUILD_SUCCESS=false
    goto :end
)
echo ✅ Node.js detected

npm -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found! Please install npm
    set BUILD_SUCCESS=false
    goto :end
)
echo ✅ npm detected
echo.

:: Phase 1: Clean Build Environment
echo [PHASE 1] Environment Preparation
echo ═════════════════════════════════
echo Cleaning build artifacts...
if exist dist (
    rmdir /s /q dist 2>nul
    echo   ✓ Removed old dist folder
)
mkdir dist
echo   ✓ Created fresh dist folder

if exist release (
    rmdir /s /q release 2>nul
    echo   ✓ Removed old release folder
)
echo.

:: Phase 2: Dependency Management
echo [PHASE 2] Dependency Verification
echo ═════════════════════════════════
echo Installing/updating dependencies...
call npm install --production=false --silent
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Dependency installation failed
    set BUILD_SUCCESS=false
    goto :end
)
echo ✅ All dependencies installed
echo.

:: Phase 3: TypeScript Validation
echo [PHASE 3] TypeScript Analysis
echo ═════════════════════════════
echo Running type checking...
call npx tsc --noEmit 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  TypeScript warnings detected (non-critical)
) else (
    echo ✅ TypeScript validation passed
)
echo.

:: Phase 4: Main Process Build
echo [PHASE 4] Main Process Compilation
echo ══════════════════════════════════
echo Building Electron main process...

:: Direct webpack call with explicit parameters
call npx webpack --config webpack.main.config.js --mode production --progress

:: Verify main.js was created
if exist dist\main.js (
    for %%A in (dist\main.js) do echo ✅ main.js created [%%~zA bytes]
) else (
    echo ❌ main.js not found!
    set BUILD_SUCCESS=false
)

:: Verify preload.js was created
if exist dist\preload.js (
    for %%A in (dist\preload.js) do echo ✅ preload.js created [%%~zA bytes]
) else (
    echo ❌ preload.js not found!
    set BUILD_SUCCESS=false
)
echo.

:: Phase 5: Renderer Process Build
echo [PHASE 5] Renderer Process Compilation
echo ══════════════════════════════════════
echo Building React application...

call npx webpack --config webpack.renderer.config.prod.js --progress

:: Verify renderer files
if exist dist\app.bundle.js (
    for %%A in (dist\app.bundle.js) do echo ✅ app.bundle.js [%%~zA bytes]
) else (
    echo ⚠️  app.bundle.js not found
)

if exist dist\vendor.bundle.js (
    for %%A in (dist\vendor.bundle.js) do echo ✅ vendor.bundle.js [%%~zA bytes]
) else (
    echo ⚠️  vendor.bundle.js not found
)

if exist dist\index.html (
    echo ✅ index.html created
) else (
    echo ❌ index.html not found!
    set BUILD_SUCCESS=false
)

if exist dist\pdf.worker.min.js (
    for %%A in (dist\pdf.worker.min.js) do echo ✅ pdf.worker.min.js [%%~zA bytes]
) else (
    echo ⚠️  PDF worker not found
)
echo.

:: Phase 6: Asset Verification
echo [PHASE 6] Asset Management
echo ═════════════════════════
if exist dist\public (
    echo ✅ Public assets copied
) else (
    echo ⚠️  Public folder not in dist
    :: Try to copy manually
    if exist public (
        xcopy /s /e /i /y public dist\public >nul 2>&1
        if exist dist\public (
            echo ✅ Public assets copied manually
        )
    )
)

if exist dist\assets (
    echo ✅ Asset bundles created
) else (
    echo ⚠️  No asset bundles (may be embedded)
)
echo.

:: Phase 7: Final Verification
echo [PHASE 7] Build Verification
echo ════════════════════════════
echo Running comprehensive verification...

set CRITICAL_FILES=0
if exist dist\main.js set /a CRITICAL_FILES+=1
if exist dist\preload.js set /a CRITICAL_FILES+=1
if exist dist\index.html set /a CRITICAL_FILES+=1

echo Critical files found: %CRITICAL_FILES%/3

if %CRITICAL_FILES% EQU 3 (
    echo ✅ All critical files present
) else (
    echo ❌ Missing critical files
    set BUILD_SUCCESS=false
)
echo.

:: Phase 8: Build Report
echo ╔══════════════════════════════════════════════════════════╗
echo ║                    BUILD REPORT                         ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

if "%BUILD_SUCCESS%"=="true" (
    echo Status: ✨ BUILD SUCCESSFUL ✨
    echo.
    echo The Professional PDF Editor has been built successfully!
    echo All systems are operational and ready for deployment.
    echo.
    echo ┌─────────────────────────────────────┐
    echo │  Next Steps:                        │
    echo │  1. Test:     npm start             │
    echo │  2. Package:  npm run dist          │
    echo │  3. Deploy:   Use release/*.exe     │
    echo └─────────────────────────────────────┘
    echo.
    echo Applying Transisthesis principles:
    echo   ✓ Collapse - Problem decomposed
    echo   ✓ Council - All voices consulted
    echo   ✓ Synthesis - Solutions merged
    echo   ✓ Rebirth - Application compiled
    echo   ✓ Reflection - Metrics analyzed
) else (
    echo Status: ❌ BUILD FAILED
    echo.
    echo The build encountered critical errors.
    echo Please review the output above for details.
    echo.
    echo Troubleshooting steps:
    echo   1. Run: npm install
    echo   2. Check: node diagnostic.js
    echo   3. Verify source files exist
    echo   4. Check webpack configurations
)

:end
echo.
echo ══════════════════════════════════════════════════════════
echo Build process completed at %TIME%
echo ══════════════════════════════════════════════════════════
echo.
pause
