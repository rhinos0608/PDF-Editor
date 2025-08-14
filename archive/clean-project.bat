@echo off
echo Archiving Legacy Files...
echo.

:: Move remaining legacy build scripts
move "PDF_EDITOR_PREMIUM.bat" "archive\" >nul 2>&1
move "run-app.bat" "archive\" >nul 2>&1
move "setup-icons.js" "archive\" >nul 2>&1
move "setup.bat" "archive\" >nul 2>&1
move "setup.ps1" "archive\" >nul 2>&1
move "smart-build.js" "archive\" >nul 2>&1
move "smart-diagnostic.bat" "archive\" >nul 2>&1
move "start-dev.bat" "archive\" >nul 2>&1
move "start-production.js" "archive\" >nul 2>&1
move "start.bat" "archive\" >nul 2>&1
move "test-build.js" "archive\" >nul 2>&1
move "test-typescript.js" "archive\" >nul 2>&1
move "test-webpack-build.bat" "archive\" >nul 2>&1
move "verify-build.bat" "archive\" >nul 2>&1
move "verify-build.js" "archive\" >nul 2>&1
move "verify-production.js" "archive\" >nul 2>&1
move "webpack.main.config.fixed.js" "archive\" >nul 2>&1
move "ULTIMATE-FIX.bat" "archive\" >nul 2>&1
move "build-production-master.bat" "archive\" >nul 2>&1
move "start-app.bat" "archive\" >nul 2>&1
move "diagnostic.js" "archive\" >nul 2>&1
move "ultimate-fix.js" "archive\" >nul 2>&1

:: Move old documentation
move "BUILD_FIX_README.md" "archive\" >nul 2>&1
move "BUILD_SOLUTION.md" "archive\" >nul 2>&1
move "BUILD_SUCCESS.md" "archive\" >nul 2>&1
move "PRODUCTION_READY.md" "archive\" >nul 2>&1

:: Clean up the archive script itself
move "archive-legacy.js" "archive\" >nul 2>&1

echo Archive complete!
echo.
echo Essential files remaining:
echo   - MASTER-FIX.bat (main solution)
echo   - complete-fix.js (comprehensive fix)
echo   - emergency-build.js (fallback)
echo   - Core project files
echo.
echo Your project is now clean and organized!
pause
