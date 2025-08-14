@echo off
echo ========================================
echo Professional PDF Editor - System Check
echo ========================================
echo.

echo Checking system requirements...
echo.

REM Check Node.js
echo [1/5] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo    [X] Node.js is NOT installed
    echo        Please install from: https://nodejs.org/
    set ERROR=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    [✓] Node.js %NODE_VERSION% is installed
)

echo.

REM Check npm
echo [2/5] Checking npm installation...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo    [X] npm is NOT installed
    set ERROR=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo    [✓] npm %NPM_VERSION% is installed
)

echo.

REM Check if dependencies are installed
echo [3/5] Checking project dependencies...
if not exist "node_modules" (
    echo    [!] Dependencies not installed
    echo        Run: npm install
    set WARNING=1
) else (
    echo    [✓] Dependencies folder exists
)

echo.

REM Check if built
echo [4/5] Checking build status...
if not exist "dist" (
    echo    [!] Application not built
    echo        Run: npm run build
    set WARNING=1
) else (
    echo    [✓] Build folder exists
)

echo.

REM Check available disk space
echo [5/5] Checking disk space...
for /f "tokens=3" %%a in ('dir C:\ ^| find "bytes free"') do set FREE_SPACE=%%a
echo    [i] Free disk space: %FREE_SPACE% bytes

echo.
echo ========================================

if defined ERROR (
    echo.
    echo [ERROR] System requirements not met!
    echo Please fix the issues above before continuing.
    echo.
) else if defined WARNING (
    echo.
    echo [WARNING] Setup incomplete!
    echo Please run setup.bat to complete installation.
    echo.
) else (
    echo.
    echo [SUCCESS] All checks passed!
    echo You can run the application with: npm start
    echo.
)

echo ========================================
echo.

REM Display system info
echo System Information:
echo -------------------
echo OS: %OS%
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo Architecture: %PROCESSOR_ARCHITECTURE%
echo Processors: %NUMBER_OF_PROCESSORS%
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% == 0 (
    echo Running with Administrator privileges: YES
) else (
    echo Running with Administrator privileges: NO
)

echo.
pause
