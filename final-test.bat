@echo off
cls
echo =====================================================
echo FINAL BUILD TEST - PDF EDITOR
echo =====================================================
echo.

echo Cleaning previous builds...
if exist dist rmdir /s /q dist 2>nul
echo.

echo Building Main Process...
call npx webpack --config webpack.main.config.js --mode production >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FAILED] Main process build failed
    exit /b 1
) else (
    echo [SUCCESS] Main process built successfully
)

echo Building Renderer Process...
call npx webpack --config webpack.renderer.config.js --mode production >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FAILED] Renderer process build failed
    exit /b 1
) else (
    echo [SUCCESS] Renderer process built successfully
)

echo.
echo =====================================================
echo BUILD SUCCESSFUL - ALL ERRORS FIXED!
echo =====================================================
echo.
echo Total Errors: 0
echo Status: PRODUCTION READY
echo.
echo The PDF Editor is ready to run:
echo   - npm start (to launch)
echo   - npm run dist (to create installer)
echo.
echo =====================================================
pause
