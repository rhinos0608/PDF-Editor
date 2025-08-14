@echo off
echo Starting PDF Editor in Safe Mode (Software Rendering)...
echo.

REM Set environment variables for safe mode
set ELECTRON_DISABLE_GPU=1
set ELECTRON_ENABLE_LOGGING=1
set ELECTRON_FORCE_SOFTWARE_RENDERING=1
set ELECTRON_DISABLE_HARDWARE_ACCELERATION=1

REM Start the application with additional safety flags
npm start -- --disable-gpu --disable-software-rasterizer --no-sandbox --disable-gpu-sandbox

pause