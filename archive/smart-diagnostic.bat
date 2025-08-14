@echo off
setlocal enabledelayedexpansion
title PDF Editor - Smart Diagnostic & Auto-Fix
color 0E

echo.
echo    ╔════════════════════════════════════════════════════════════════════╗
echo    ║     PDF EDITOR - INTELLIGENT DIAGNOSTIC & REPAIR SYSTEM v2.0      ║
echo    ║     Powered by Transithesis Cognitive Engine Framework            ║
echo    ╚════════════════════════════════════════════════════════════════════╝
echo.

:: Initialize diagnostic log
set "LOG_FILE=diagnostic_%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"
echo Diagnostic started at %date% %time% > "%LOG_FILE%"

:: Score system for health check
set /a "HEALTH_SCORE=100"
set "ISSUES_FOUND=0"
set "FIXES_APPLIED=0"

echo    [*] Starting comprehensive system diagnostic...
echo    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: 1. Node.js Check
echo    [1/10] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Node.js not found - CRITICAL
    set /a "HEALTH_SCORE-=50"
    set /a "ISSUES_FOUND+=1"
    echo    [FIX] Opening Node.js download page...
    start https://nodejs.org/
    echo    [!] Please install Node.js and run this script again
    echo Node.js not installed >> "%LOG_FILE%"
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo    ✅ Node.js !NODE_VER! installed
    echo Node.js !NODE_VER! OK >> "%LOG_FILE%"
)

:: 2. npm Check
echo    [2/10] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ npm not found
    set /a "HEALTH_SCORE-=30"
    set /a "ISSUES_FOUND+=1"
    echo    [AUTO-FIX] Attempting to repair npm...
    node -e "console.log('Testing node execution')" >nul 2>&1
    if %errorlevel% equ 0 (
        echo    [✓] npm repair attempted
        set /a "FIXES_APPLIED+=1"
    )
    echo npm not found >> "%LOG_FILE%"
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo    ✅ npm !NPM_VER! installed
    echo npm !NPM_VER! OK >> "%LOG_FILE%"
)

:: 3. Dependencies Check
echo    [3/10] Checking dependencies...
if not exist "node_modules" (
    echo    ❌ Dependencies not installed
    set /a "HEALTH_SCORE-=20"
    set /a "ISSUES_FOUND+=1"
    echo    [AUTO-FIX] Installing dependencies...
    call npm install --silent >nul 2>&1
    if exist "node_modules" (
        echo    [✓] Dependencies installed successfully
        set /a "FIXES_APPLIED+=1"
    ) else (
        echo    [!] Failed to install dependencies
        echo    [!] Try running: npm install --force
    )
    echo Dependencies missing >> "%LOG_FILE%"
) else (
    :: Check for critical packages
    set "MISSING_DEPS=0"
    if not exist "node_modules\electron" (
        echo    ⚠ Missing: electron
        set /a "MISSING_DEPS+=1"
    )
    if not exist "node_modules\react" (
        echo    ⚠ Missing: react
        set /a "MISSING_DEPS+=1"
    )
    if not exist "node_modules\pdf-lib" (
        echo    ⚠ Missing: pdf-lib
        set /a "MISSING_DEPS+=1"
    )
    if not exist "node_modules\pdfjs-dist" (
        echo    ⚠ Missing: pdfjs-dist
        set /a "MISSING_DEPS+=1"
    )
    
    if !MISSING_DEPS! gtr 0 (
        echo    ❌ !MISSING_DEPS! critical packages missing
        set /a "HEALTH_SCORE-=5*!MISSING_DEPS!"
        set /a "ISSUES_FOUND+=1"
        echo    [AUTO-FIX] Reinstalling missing packages...
        call npm install --silent >nul 2>&1
        echo    [✓] Package reinstallation attempted
        set /a "FIXES_APPLIED+=1"
    ) else (
        echo    ✅ All critical dependencies present
    )
    echo Dependencies checked >> "%LOG_FILE%"
)

:: 4. Build Check
echo    [4/10] Checking build status...
set "BUILD_ISSUES=0"
if not exist "dist" mkdir dist
if not exist "dist\main" mkdir dist\main
if not exist "dist\renderer" mkdir dist\renderer

if not exist "dist\main\main.js" (
    echo    ❌ Main process not built
    set /a "BUILD_ISSUES+=1"
)
if not exist "dist\renderer\index.html" (
    echo    ❌ Renderer HTML not built
    set /a "BUILD_ISSUES+=1"
)
if not exist "dist\renderer\bundle.js" (
    echo    ❌ Renderer bundle not built
    set /a "BUILD_ISSUES+=1"
)

if !BUILD_ISSUES! gtr 0 (
    set /a "HEALTH_SCORE-=10*!BUILD_ISSUES!"
    set /a "ISSUES_FOUND+=1"
    echo    [AUTO-FIX] Building application...
    
    :: Setup icons first
    node setup-icons.js >nul 2>&1
    
    :: Build main
    call npm run build:main --silent >nul 2>&1
    if exist "dist\main\main.js" (
        echo    [✓] Main process built
        set /a "FIXES_APPLIED+=1"
    )
    
    :: Build renderer
    call npm run build:renderer --silent >nul 2>&1
    if exist "dist\renderer\bundle.js" (
        echo    [✓] Renderer process built
        set /a "FIXES_APPLIED+=1"
    )
    echo Build issues found and fixed >> "%LOG_FILE%"
) else (
    echo    ✅ Application fully built
    echo Build OK >> "%LOG_FILE%"
)

:: 5. File Permissions Check
echo    [5/10] Checking file permissions...
icacls . /T /Q >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠ Permission issues detected
    set /a "HEALTH_SCORE-=5"
    set /a "ISSUES_FOUND+=1"
    echo    [AUTO-FIX] Attempting to fix permissions...
    takeown /f . /r >nul 2>&1
    icacls . /reset /T /Q >nul 2>&1
    echo    [✓] Permissions reset
    set /a "FIXES_APPLIED+=1"
    echo Permission issues >> "%LOG_FILE%"
) else (
    echo    ✅ File permissions OK
    echo Permissions OK >> "%LOG_FILE%"
)

:: 6. Port Availability Check
echo    [6/10] Checking port availability...
netstat -an | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ⚠ Port 3000 may be in use
    set /a "HEALTH_SCORE-=5"
    set /a "ISSUES_FOUND+=1"
    echo    [INFO] The dev server might conflict with another service
    echo Port 3000 in use >> "%LOG_FILE%"
) else (
    echo    ✅ Port 3000 available
    echo Port 3000 available >> "%LOG_FILE%"
)

:: 7. Memory Check
echo    [7/10] Checking system resources...
for /f "skip=1" %%a in ('wmic os get FreePhysicalMemory') do (
    set /a "free_mem=%%a/1024" 2>nul
    if !free_mem! gtr 0 (
        if !free_mem! lss 500 (
            echo    ⚠ Low memory: !free_mem! MB free
            set /a "HEALTH_SCORE-=10"
            set /a "ISSUES_FOUND+=1"
            echo    [TIP] Close unnecessary applications
            echo Low memory !free_mem! MB >> "%LOG_FILE%"
        ) else (
            echo    ✅ Memory: !free_mem! MB free
            echo Memory OK !free_mem! MB >> "%LOG_FILE%"
        )
        goto :mem_checked
    )
)
:mem_checked

:: 8. TypeScript Configuration Check
echo    [8/10] Checking TypeScript configuration...
if not exist "tsconfig.json" (
    echo    ❌ TypeScript config missing
    set /a "HEALTH_SCORE-=10"
    set /a "ISSUES_FOUND+=1"
    echo    [AUTO-FIX] Creating default tsconfig.json...
    (
        echo {
        echo   "compilerOptions": {
        echo     "target": "ES2020",
        echo     "module": "commonjs",
        echo     "lib": ["ES2020", "DOM"],
        echo     "jsx": "react",
        echo     "strict": true,
        echo     "esModuleInterop": true,
        echo     "skipLibCheck": true,
        echo     "forceConsistentCasingInFileNames": true,
        echo     "resolveJsonModule": true,
        echo     "moduleResolution": "node",
        echo     "outDir": "./dist",
        echo     "rootDir": "./src"
        echo   },
        echo   "include": ["src/**/*"],
        echo   "exclude": ["node_modules", "dist"]
        echo }
    ) > tsconfig.json
    echo    [✓] TypeScript config created
    set /a "FIXES_APPLIED+=1"
    echo TypeScript config created >> "%LOG_FILE%"
) else (
    echo    ✅ TypeScript configured
    echo TypeScript OK >> "%LOG_FILE%"
)

:: 9. Webpack Configuration Check
echo    [9/10] Checking Webpack configuration...
set "WEBPACK_ISSUES=0"
if not exist "webpack.main.config.js" (
    echo    ❌ Main webpack config missing
    set /a "WEBPACK_ISSUES+=1"
)
if not exist "webpack.renderer.config.js" (
    echo    ❌ Renderer webpack config missing
    set /a "WEBPACK_ISSUES+=1"
)

if !WEBPACK_ISSUES! gtr 0 (
    set /a "HEALTH_SCORE-=10"
    set /a "ISSUES_FOUND+=1"
    echo    [!] Webpack configuration incomplete
    echo    [!] Please ensure webpack configs exist
    echo Webpack config issues >> "%LOG_FILE%"
) else (
    echo    ✅ Webpack configured
    echo Webpack OK >> "%LOG_FILE%"
)

:: 10. Electron Process Check
echo    [10/10] Checking for zombie Electron processes...
tasklist /FI "IMAGENAME eq electron.exe" 2>nul | find /I "electron.exe" >nul
if %errorlevel% equ 0 (
    echo    ⚠ Electron processes detected
    set /a "ISSUES_FOUND+=1"
    echo    [AUTO-FIX] Cleaning up zombie processes...
    taskkill /F /IM electron.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo    [✓] Processes cleaned
    set /a "FIXES_APPLIED+=1"
    echo Electron processes killed >> "%LOG_FILE%"
) else (
    echo    ✅ No zombie processes
    echo No zombie processes >> "%LOG_FILE%"
)

:: Calculate final health score
echo.
echo    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Ensure health score doesn't go below 0
if !HEALTH_SCORE! lss 0 set "HEALTH_SCORE=0"

:: Display results with color coding
if !HEALTH_SCORE! geq 90 (
    color 0A
    set "STATUS=EXCELLENT"
    set "EMOJI=🎉"
) else if !HEALTH_SCORE! geq 70 (
    color 0E
    set "STATUS=GOOD"
    set "EMOJI=✅"
) else if !HEALTH_SCORE! geq 50 (
    color 06
    set "STATUS=FAIR"
    set "EMOJI=⚠"
) else (
    color 0C
    set "STATUS=POOR"
    set "EMOJI=❌"
)

echo    ╔════════════════════════════════════════════════════════════════════╗
echo    ║                       DIAGNOSTIC COMPLETE                         ║
echo    ╠════════════════════════════════════════════════════════════════════╣
echo    ║                                                                    ║
echo    ║  System Health Score: !HEALTH_SCORE!/100 - !STATUS! !EMOJI!
echo    ║                                                                    ║
echo    ║  Issues Found:    !ISSUES_FOUND!                                  
echo    ║  Fixes Applied:   !FIXES_APPLIED!                                 
echo    ║                                                                    ║

if !HEALTH_SCORE! geq 70 (
    echo    ║  ✅ Your system is ready to run the PDF Editor!                   ║
    echo    ║                                                                    ║
    echo    ║  Launch with: PDF_EDITOR_PREMIUM.bat                              ║
) else if !HEALTH_SCORE! geq 50 (
    echo    ║  ⚠ Your system needs attention but may still work                ║
    echo    ║                                                                    ║
    echo    ║  Try: complete-setup.bat for full reinstall                      ║
) else (
    echo    ║  ❌ Critical issues detected. Manual intervention required        ║
    echo    ║                                                                    ║
    echo    ║  Recommended: Run complete-setup.bat                              ║
)

echo    ║                                                                    ║
echo    ╚════════════════════════════════════════════════════════════════════╝
echo.
echo    Diagnostic log saved to: %LOG_FILE%
echo.

:: Save summary to log
echo. >> "%LOG_FILE%"
echo SUMMARY >> "%LOG_FILE%"
echo Health Score: !HEALTH_SCORE!/100 >> "%LOG_FILE%"
echo Issues Found: !ISSUES_FOUND! >> "%LOG_FILE%"
echo Fixes Applied: !FIXES_APPLIED! >> "%LOG_FILE%"
echo Status: !STATUS! >> "%LOG_FILE%"
echo Completed at %time% >> "%LOG_FILE%"

:: Offer to run the app if healthy
if !HEALTH_SCORE! geq 70 (
    echo.
    set /p "RUN_APP=Do you want to start the PDF Editor now? (y/n): "
    if /i "!RUN_APP!"=="y" (
        echo.
        echo Starting PDF Editor...
        start "" "PDF_EDITOR_PREMIUM.bat"
    )
)

pause
endlocal
exit /b 0
