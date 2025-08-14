@echo off
echo ========================================
echo PROFESSIONAL PDF EDITOR - PRODUCTION BUILD
echo ========================================
echo.

:: Set Node environment to production
set NODE_ENV=production

:: Step 1: Clean previous builds
echo [1/6] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release
echo Done.
echo.

:: Step 2: Install dependencies
echo [2/6] Checking dependencies...
call npm install --production=false
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    goto :error
)
echo Done.
echo.

:: Step 3: Run TypeScript type checking
echo [3/6] Running TypeScript type check...
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: TypeScript type errors detected, continuing build...
)
echo Done.
echo.

:: Step 4: Build main process
echo [4/6] Building main process...
call npm run build:main
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Main process build failed
    goto :error
)
echo Done.
echo.

:: Step 5: Build renderer process
echo [5/6] Building renderer process...
call npm run build:renderer
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Renderer process build failed
    goto :error
)
echo Done.
echo.

:: Step 6: Verify build output
echo [6/6] Verifying build output...
if not exist dist\main.js (
    echo ERROR: Main process bundle not found
    goto :error
)
if not exist dist\renderer.js (
    echo ERROR: Renderer bundle not found
    goto :error
)
if not exist dist\index.html (
    echo ERROR: HTML entry point not found
    goto :error
)
echo Done.
echo.

:: Success
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo Build output is in the 'dist' folder.
echo.
echo Next steps:
echo 1. Test the application: npm start
echo 2. Create installer: npm run dist
echo.
goto :end

:error
echo.
echo ========================================
echo BUILD FAILED
echo ========================================
echo Please check the error messages above.
echo.

:end
pause
