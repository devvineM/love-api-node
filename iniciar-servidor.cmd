@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

set "DEFAULT_PORT=3000"
set "SELECTED_PORT=%~1"

if not defined SELECTED_PORT (
  set /p SELECTED_PORT=Porta do backend [%DEFAULT_PORT%]: 
)

if not defined SELECTED_PORT (
  set "SELECTED_PORT=%DEFAULT_PORT%"
)

echo.
echo Iniciando backend na porta %SELECTED_PORT%...
echo.

set "PORT=%SELECTED_PORT%"
call npm run dev
