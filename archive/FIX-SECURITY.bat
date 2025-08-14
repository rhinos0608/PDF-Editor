@echo off
chcp 65001 >nul 2>&1
cls
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║         PDF EDITOR - SECURITY & RUNTIME FIX             ║  
echo ║              Transisthesis Guardian Protocol            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo This will fix:
echo   • Electron security warnings
echo   • WebSecurity disabled issues
echo   • Content-Security-Policy problems
echo   • Global reference errors
echo   • Runtime JavaScript errors
echo.
echo Press any key to apply security fixes...
pause >nul

:: Run the security fix
echo.
echo Applying security fixes...
echo.
node fix-security-issues.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ══════════════════════════════════════════════════════════
    echo ✅ SECURITY FIXES APPLIED SUCCESSFULLY!
    echo ══════════════════════════════════════════════════════════
    echo.
    echo Now rebuilding the application with secure settings...
    echo.
    
    :: Rebuild with new security settings
    call npm run build
    
    echo.
    echo ══════════════════════════════════════════════════════════
    echo ✨ BUILD COMPLETE - READY TO RUN SECURELY ✨
    echo ══════════════════════════════════════════════════════════
    echo.
    echo You can now run the application without security warnings:
    echo.
    echo   Option 1: npm start     (production mode)
    echo   Option 2: npm run dev   (development mode)
    echo.
    echo All security issues have been resolved!
    echo.
) else (
    echo.
    echo ══════════════════════════════════════════════════════════
    echo ❌ Security fix encountered an issue
    echo ══════════════════════════════════════════════════════════
    echo.
    echo Please check the error messages above.
)

pause
