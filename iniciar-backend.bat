@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" python -m venv .venv
if errorlevel 1 goto erro
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto erro
".venv\Scripts\python.exe" -m uvicorn app.main:app --port 8000
if errorlevel 1 goto erro
exit /b 0
:erro
echo.
echo Falha ao iniciar o backend. Verifique se Python 3.10+ esta instalado e conectado a internet.
pause
