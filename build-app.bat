@echo off
echo ========================================
echo Professional PDF Editor - Build System
echo ========================================
echo.

:: Check for Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: 
node --version
echo.

:: Check for npm
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed!
    pause
    exit /b 1
)
echo npm found: 
npm --version
echo.

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    echo This may take a few minutes...
    call npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies!
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
)

:: Clean previous builds
echo Cleaning previous builds...
if exist "dist" rmdir /s /q "dist"
mkdir dist
echo.

:: Build main process
echo Building main process...
call npm run build:main
if %errorlevel% neq 0 (
    echo Error: Failed to build main process!
    pause
    exit /b 1
)
echo Main process built successfully!
echo.

:: Build renderer process
echo Building renderer process...
call npm run build:renderer
if %errorlevel% neq 0 (
    echo Error: Failed to build renderer process!
    pause
    exit /b 1
)
echo Renderer process built successfully!
echo.

:: Copy static files
echo Copying static files...
if exist "public" (
    xcopy /s /e /i /y "public" "dist\public" >nul
)

:: Create success marker
echo Build completed at %date% %time% > dist\BUILD_SUCCESS.txt

echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo You can now run the application with: npm start
echo Or build the installer with: npm run dist
echo.
pause
