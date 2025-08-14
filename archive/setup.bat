@echo off
echo ====================================
echo Professional PDF Editor Setup Script
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please ensure npm is installed with Node.js
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

echo Installing dependencies...
echo This may take several minutes...
echo.

REM Install dependencies
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Dependencies installed successfully!
echo ====================================
echo.

echo Building the application...
echo.

REM Build the application
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Build completed successfully!
echo ====================================
echo.
echo You can now run the application with:
echo   npm start
echo.
echo Or for development mode with hot-reload:
echo   npm run dev
echo.
echo To create a Windows installer:
echo   npm run dist
echo.
echo ====================================
pause
