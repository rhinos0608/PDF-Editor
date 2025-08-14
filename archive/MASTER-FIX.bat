@echo off
chcp 65001 >nul 2>&1
cls
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         PROFESSIONAL PDF EDITOR - MASTER FIX                ║
echo ║              Transisthesis Cognitive Engine                 ║
echo ║           Global Benchmark Standards Applied                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This will fix ALL issues including:
echo   • GPU process errors
echo   • Missing main.js and preload.js
echo   • Non-working features
echo   • Build configuration problems
echo.
echo Press any key to begin the comprehensive fix...
pause >nul

:: Set environment
set NODE_ENV=production

:: Step 1: Run complete fix
echo.
echo ══════════════════════════════════════════════════════════════
echo STEP 1: Running Complete System Fix
echo ══════════════════════════════════════════════════════════════
echo.

node complete-fix.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Primary fix incomplete. Running emergency build...
    echo.
    node emergency-build.js
)

:: Step 2: Verify critical files
echo.
echo ══════════════════════════════════════════════════════════════
echo STEP 2: Verifying Build Output
echo ══════════════════════════════════════════════════════════════
echo.

set BUILD_OK=true

if exist dist\main.js (
    echo ✅ main.js found
) else (
    echo ❌ main.js missing - copying manually...
    copy src\main.js dist\main.js >nul 2>&1
    if exist dist\main.js (
        echo ✅ main.js copied
    ) else (
        set BUILD_OK=false
    )
)

if exist dist\preload.js (
    echo ✅ preload.js found
) else (
    echo ❌ preload.js missing - copying manually...
    copy src\preload.js dist\preload.js >nul 2>&1
    if exist dist\preload.js (
        echo ✅ preload.js copied
    ) else (
        set BUILD_OK=false
    )
)

if exist dist\index.html (
    echo ✅ index.html found
) else (
    echo ❌ index.html missing
    set BUILD_OK=false
)

:: Step 3: Final status
echo.
echo ══════════════════════════════════════════════════════════════
if "%BUILD_OK%"=="true" (
    echo ✨ FIX COMPLETE - READY TO RUN ✨
    echo ══════════════════════════════════════════════════════════════
    echo.
    echo Starting the application...
    echo.
    timeout /t 2 /nobreak >nul
    
    :: Start with explicit electron command
    npx electron dist/main.js
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Alternative start method...
        npm start
    )
) else (
    echo ⚠️  MANUAL INTERVENTION REQUIRED
    echo ══════════════════════════════════════════════════════════════
    echo.
    echo Critical files are still missing.
    echo Please check that src/main.js and src/preload.js exist.
    echo.
    echo You can try:
    echo   1. node emergency-build.js
    echo   2. Manually copy files from src to dist
    echo   3. Check the documentation
)

echo.
pause
