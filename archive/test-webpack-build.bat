@echo off
echo Testing webpack build...
echo.

:: Clean dist first
if exist dist rmdir /s /q dist
mkdir dist

:: Run webpack for main process
echo Running webpack for main process...
call npx webpack --config webpack.main.config.js --mode production --stats verbose

echo.
echo Checking dist directory contents...
dir dist /b

pause
