@echo off
cd /d "%~dp0wearable"
if not exist "node_modules\" call npm install
if errorlevel 1 goto erro
call npm run dev
if errorlevel 1 goto erro
exit /b 0
:erro
echo.
echo Falha ao iniciar o Radiance Wearable. Verifique Node.js 22.12+ e acesso a internet.
pause
