@echo off
cls
color 0A
echo ==============================================================
echo   PDF Editor Dependency Fix v15.1
echo   Installing dependencies and building application
echo ==============================================================
echo.
echo This will:
echo   1. Check for missing dependencies
echo   2. Install any missing packages
echo   3. Build the application
echo   4. Launch the PDF Editor
echo.
echo Press any key to start...
pause >nul

:: Run the dependency fix
node fix-dependencies-first.js

echo.
echo ==============================================================
echo   Process complete!
echo ==============================================================
echo.
echo If the application didn't launch, try:
echo   npx electron . --disable-gpu
echo.
pause
