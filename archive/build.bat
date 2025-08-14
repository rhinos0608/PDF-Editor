@echo off
echo =====================================
echo Building Professional PDF Editor
echo =====================================
echo.

echo Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release

echo.
echo Building application...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Creating installer...
call npm run dist

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to create installer!
    pause
    exit /b 1
)

echo.
echo =====================================
echo Build completed successfully!
echo =====================================
echo.
echo The installer can be found in the 'release' folder.
echo.
pause
