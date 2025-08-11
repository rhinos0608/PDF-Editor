@echo off
echo ========================================
echo FINAL BUILD VERIFICATION
echo ========================================
echo.

echo Cleaning previous builds...
if exist dist rmdir /s /q dist

echo.
echo Building application...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL - NO ERRORS!
    echo ========================================
    echo.
    echo All TypeScript errors have been fixed!
    echo The application is ready to run.
    echo.
    echo To start: npm start
    echo To package: npm run dist
    echo.
) else (
    echo.
    echo ========================================
    echo BUILD FAILED
    echo ========================================
    echo Please check the error messages above.
)

pause
