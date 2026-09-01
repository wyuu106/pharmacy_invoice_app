@echo off
setlocal

set "NPM_CMD="
for /f "delims=" %%I in ('where npm.cmd 2^>nul') do if not defined NPM_CMD set "NPM_CMD=%%I"

if not defined NPM_CMD (
  echo npm.cmdが見つかりません。Node.jsをインストールしてください。
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-app.ps1" -NpmCommandPath "%NPM_CMD%"
if errorlevel 1 (
  echo.
  echo 起動に失敗しました。上のメッセージを確認してください。
  pause
)
endlocal
