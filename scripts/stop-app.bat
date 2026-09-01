@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-app.ps1"
if errorlevel 1 (
  echo.
  echo 停止処理でエラーが発生しました。上のメッセージを確認してください。
  pause
)
endlocal
