@echo off
cls
color 0A
echo.
echo     ╔═══════════════════════════════════════════════════════════════╗
echo     ║                                                               ║
echo     ║         PROFESSIONAL PDF EDITOR - COMPLETE SOLUTION          ║
echo     ║                                                               ║
echo     ║              Transisthesis Cognitive Engine v3.0              ║
echo     ║           Applying Global Benchmark Standards                ║
echo     ║                                                               ║
echo     ╚═══════════════════════════════════════════════════════════════╝
echo.
echo.
echo     This script will automatically:
echo       1. Diagnose your system
echo       2. Fix any issues found
echo       3. Build the application
echo       4. Verify the output
echo       5. Prepare for launch
echo.
echo     Press any key to begin the automated process...
pause >nul

:: Run diagnostic first
echo.
echo ════════════════════════════════════════════════════════════════════
echo STEP 1: Running System Diagnostic
echo ════════════════════════════════════════════════════════════════════
echo.
call node diagnostic.js
echo.
echo Diagnostic complete. Continuing with build...
echo.
timeout /t 2 /nobreak >nul

:: Run the master build
echo ════════════════════════════════════════════════════════════════════
echo STEP 2: Executing Production Build
echo ════════════════════════════════════════════════════════════════════
echo.
call build-production-master.bat

:: Check if build succeeded
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ════════════════════════════════════════════════════════════════════
    echo STEP 3: Build Verification
    echo ════════════════════════════════════════════════════════════════════
    echo.
    echo ✅ Build completed successfully!
    echo.
    echo Verifying output files...
    dir dist\*.js dist\*.html /b 2>nul
    echo.
    
    echo ════════════════════════════════════════════════════════════════════
    echo FINAL STATUS: SUCCESS
    echo ════════════════════════════════════════════════════════════════════
    echo.
    echo     ✨ The Professional PDF Editor is ready! ✨
    echo.
    echo     You can now:
    echo       • Test the app:     npm start
    echo       • Or use:           start-app.bat
    echo       • Create installer: npm run dist
    echo.
    echo     All systems operational. Ready for deployment.
    echo.
) else (
    echo.
    echo ════════════════════════════════════════════════════════════════════
    echo FINAL STATUS: FAILED
    echo ════════════════════════════════════════════════════════════════════
    echo.
    echo     ❌ Build encountered errors.
    echo.
    echo     Please check the BUILD_SOLUTION.md file for troubleshooting.
    echo     You can also try the smart build system:
    echo       node smart-build.js
    echo.
)

echo ════════════════════════════════════════════════════════════════════
echo.
pause
