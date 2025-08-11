@echo off
echo ========================================
echo Professional PDF Editor - Production Build
echo ========================================
echo.

echo Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release

echo.
echo Installing dependencies...
call npm install

echo.
echo Installing missing type definitions...
call npm install --save-dev @types/react-color

echo.
echo Building main process...
call npm run build:main

echo.
echo Building renderer process...
call npm run build:renderer

echo.
echo Build complete!
echo.
echo To start the application, run: npm start
echo To package for distribution, run: npm run dist
echo.
pause
