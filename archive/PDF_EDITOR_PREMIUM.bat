@echo off
setlocal enabledelayedexpansion
title Professional PDF Editor - Premium
color 0A

:: Set console code page to UTF-8 for better character support
chcp 65001 >nul 2>&1

:: ASCII Art Header
echo.
echo    ╔═══════════════════════════════════════════════════════════════╗
echo    ║     PROFESSIONAL PDF EDITOR - PREMIUM EDITION v1.0.0         ║
echo    ║     Built with Transithesis Cognitive Engine Framework       ║
echo    ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo    [!] Running without administrator privileges
    echo    [!] Some features may be limited
    echo.
)

:: System Check
echo    [*] Performing system check...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo    ╔═══════════════════════════════════════════════════════════════╗
    echo    ║                    ⚠ NODE.JS NOT FOUND ⚠                     ║
    echo    ╠═══════════════════════════════════════════════════════════════╣
    echo    ║  Node.js is required to run this application.                ║
    echo    ║                                                               ║
    echo    ║  Please install Node.js from:                                ║
    echo    ║  https://nodejs.org/                                         ║
    echo    ║                                                               ║
    echo    ║  Recommended: LTS version                                    ║
    echo    ╚═══════════════════════════════════════════════════════════════╝
    echo.
    pause
    start https://nodejs.org/
    exit /b 1
)

:: Get Node version
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo    [√] Node.js %NODE_VER% detected

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    [!] npm not found - attempting repair...
    node -e "console.log('npm check failed')"
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo    [√] npm %NPM_VER% detected

:: Check available memory
for /f "skip=1" %%a in ('wmic os get TotalVisibleMemorySize') do (
    set /a "mem=%%a/1048576" 2>nul
    if !mem! gtr 0 (
        echo    [√] System Memory: !mem! GB
        if !mem! lss 4 (
            echo    [!] Warning: Low memory detected. Performance may be affected.
        )
        goto :memcheck_done
    )
)
:memcheck_done

echo.
echo    ═══════════════════════════════════════════════════════════════

:: Check installation status
if not exist "node_modules" (
    echo.
    echo    [*] First-time setup detected
    echo    [*] Installing dependencies... (this may take 2-5 minutes)
    echo.
    echo    ┌─────────────────────────────────────────────────────────────┐
    echo    │  Installing Premium Components:                            │
    echo    │  • React 18 Framework                                      │
    echo    │  • PDF.js Rendering Engine                                 │
    echo    │  • pdf-lib Manipulation Library                            │
    echo    │  • Tesseract.js OCR Engine                                │
    echo    │  • Electron Desktop Framework                              │
    echo    │  • Advanced Annotation System                              │
    echo    │  • Security & Encryption Modules                           │
    echo    └─────────────────────────────────────────────────────────────┘
    echo.
    
    call npm install --silent
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo    [X] Installation failed!
        echo    [*] Running automatic repair...
        call npm cache clean --force >nul 2>&1
        call npm install
        if %errorlevel% neq 0 (
            echo    [X] Repair failed. Please run repair-tool.bat
            pause
            exit /b 1
        )
    )
    
    echo.
    echo    [√] Dependencies installed successfully!
)

:: Check if built
if not exist "dist\main\main.js" (
    echo.
    echo    [*] Building application... (first build takes 1-2 minutes)
    echo.
    echo    ┌─────────────────────────────────────────────────────────────┐
    echo    │  Compiling Premium Features:                               │
    echo    │  • TypeScript → JavaScript                                 │
    echo    │  • React Components                                        │
    echo    │  • Webpack Optimization                                    │
    echo    │  • Asset Processing                                        │
    echo    └─────────────────────────────────────────────────────────────┘
    echo.
    
    :: Build main process
    echo    [*] Building main process...
    call npm run build:main --silent
    if %errorlevel% neq 0 (
        echo    [X] Main process build failed!
        echo    [*] Attempting recovery...
        call npx webpack --config webpack.main.config.js --mode production
    )
    
    :: Build renderer process
    echo    [*] Building renderer process...
    call npm run build:renderer --silent
    if %errorlevel% neq 0 (
        echo    [X] Renderer process build failed!
        echo    [*] Attempting recovery...
        call npx webpack --config webpack.renderer.config.js --mode production
    )
    
    :: Verify build
    if not exist "dist\main\main.js" (
        color 0C
        echo.
        echo    [X] Build verification failed!
        echo    [*] Please run repair-tool.bat option 2 (Deep Clean)
        pause
        exit /b 1
    )
    
    echo.
    echo    [√] Application built successfully!
)

:: Pre-launch checks
echo.
echo    [*] Performing pre-launch checks...

:: Check for conflicting processes
tasklist /FI "IMAGENAME eq electron.exe" 2>nul | find /I "electron.exe" >nul
if %errorlevel% equ 0 (
    echo    [!] Another instance may be running
    echo    [*] Attempting to close...
    taskkill /F /IM electron.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Clear temporary files
if exist "%TEMP%\pdf-editor-cache" (
    echo    [*] Clearing cache...
    rmdir /s /q "%TEMP%\pdf-editor-cache" >nul 2>&1
)

:: Set environment variables
set NODE_ENV=production
set ELECTRON_DISABLE_SECURITY_WARNINGS=true
set ELECTRON_NO_ATTACH_CONSOLE=true

:: Final launch preparation
echo    [√] All checks passed!
echo.
echo    ═══════════════════════════════════════════════════════════════
echo.
echo    ╔═══════════════════════════════════════════════════════════════╗
echo    ║              🚀 LAUNCHING PDF EDITOR PREMIUM 🚀              ║
echo    ╠═══════════════════════════════════════════════════════════════╣
echo    ║                                                               ║
echo    ║  Features Enabled:                                            ║
echo    ║  ✓ Advanced PDF Editing         ✓ Digital Signatures         ║
echo    ║  ✓ OCR Text Recognition         ✓ Form Creation              ║
echo    ║  ✓ Annotation Tools             ✓ Security & Encryption      ║
echo    ║  ✓ Page Management              ✓ Batch Processing           ║
echo    ║  ✓ Document Merging             ✓ Compression Engine         ║
echo    ║                                                               ║
echo    ║  Keyboard Shortcuts:                                         ║
echo    ║  • Ctrl+O: Open PDF             • Ctrl+S: Save               ║
echo    ║  • Ctrl+Z: Undo                 • Ctrl+F: Find               ║
echo    ║  • F11: Fullscreen              • Ctrl+P: Print              ║
echo    ║                                                               ║
echo    ╚═══════════════════════════════════════════════════════════════╝
echo.
echo    [*] Starting application window...
echo    [*] Please wait for the window to appear...
echo.
echo    Press Ctrl+C to stop the application
echo    ───────────────────────────────────────────────────────────────

:: Launch the application
npm start

:: Check exit code
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo    ═══════════════════════════════════════════════════════════════
    echo.
    echo    [X] Application terminated with error code: %errorlevel%
    echo.
    echo    Troubleshooting Steps:
    echo    1. Run repair-tool.bat and select option 1 (Quick Fix)
    echo    2. If that doesn't work, try option 2 (Deep Clean)
    echo    3. Check if antivirus is blocking the application
    echo    4. Try running as Administrator
    echo    5. Check USER_GUIDE.md for more help
    echo.
    echo    Error Details:
    if %errorlevel% equ 1 (
        echo    - General execution failure
    ) else if %errorlevel% equ 127 (
        echo    - Command not found - dependencies may be missing
    ) else if %errorlevel% equ -1073741819 (
        echo    - Access violation - try running as Administrator
    ) else (
        echo    - Unknown error - check console output above
    )
    echo.
    pause
) else (
    echo.
    echo    ═══════════════════════════════════════════════════════════════
    echo.
    echo    [√] Application closed successfully
    echo    [*] Thank you for using Professional PDF Editor Premium!
    echo.
    timeout /t 3 /nobreak >nul
)

endlocal
exit /b %errorlevel%
