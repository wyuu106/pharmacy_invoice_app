@echo off
setlocal

set "NPM_CMD="
for /f "delims=" %%I in ('where npm.cmd 2^>nul') do (
  if not defined NPM_CMD set "NPM_CMD=%%I"
)

if not defined NPM_CMD (
  echo npm.cmd was not found. Install Node.js first.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass ^
  -File "%~dp0start-app.ps1" ^
  -NpmCommandPath "%NPM_CMD%"
if errorlevel 1 (
  echo.
  echo Startup failed. Check the message above.
  pause
)
endlocal
