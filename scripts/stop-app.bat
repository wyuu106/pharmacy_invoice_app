@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass ^
  -File "%~dp0stop-app.ps1"
if errorlevel 1 (
  echo.
  echo Stop failed. Check the message above.
  pause
)
endlocal
