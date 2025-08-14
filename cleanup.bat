@echo off
echo Performing complete cleanup...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul
timeout /T 2 /NOBREAK
rd /s /q node_modules 2>nul
del package-lock.json 2>nul
del yarn.lock 2>nul
rd /s /q dist 2>nul
rd /s /q .npm 2>nul
echo Cleanup complete.