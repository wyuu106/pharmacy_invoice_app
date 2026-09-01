@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-app.ps1"
if errorlevel 1 (
  echo.
  echo 起動に失敗しました。上のメッセージを確認してください。
  pause
)
endlocal
