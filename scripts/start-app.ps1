$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$ProjectDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectDir "backend"
$FrontendDir = Join-Path $ProjectDir "frontend"
$RunDir = Join-Path $ScriptDir ".run"
$LogDir = Join-Path $ScriptDir "logs"
$BackendPidFile = Join-Path $RunDir "backend.pid"
$FrontendPidFile = Join-Path $RunDir "frontend.pid"
$PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
$BackendReadyFile = Join-Path $BackendDir ".venv\.dependencies-installed"
$ViteScript = Join-Path $FrontendDir "node_modules\vite\bin\vite.js"
$AppUrl = "http://localhost:5174/invoice"

New-Item -ItemType Directory -Force -Path $RunDir, $LogDir | Out-Null

function Test-RecordedProcess {
    param([string]$PidFile)
    if (-not (Test-Path $PidFile)) { return $false }
    $RecordedPid = (Get-Content $PidFile -Raw).Trim()
    if ($RecordedPid -notmatch '^\d+$') { return $false }
    return $null -ne (Get-Process -Id ([int]$RecordedPid) -ErrorAction SilentlyContinue)
}

function Wait-ForUrl {
    param([string]$Url, [string]$Name)
    for ($Attempt = 0; $Attempt -lt 60; $Attempt++) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
            return
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }
    throw "$Nameを起動できませんでした。scripts\logsのログを確認してください。"
}

try {
    Write-Host "薬局請求書アプリを起動しています..."

    if (-not (Test-Path $PythonExe)) {
        $PythonLauncher = Get-Command py.exe -ErrorAction SilentlyContinue
        if ($PythonLauncher) {
            & $PythonLauncher.Source -3 -m venv (Join-Path $BackendDir ".venv")
        }
        else {
            $PythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
            if (-not $PythonCommand) { throw "Python 3が見つかりません。Python 3をインストールしてください。" }
            & $PythonCommand.Source -m venv (Join-Path $BackendDir ".venv")
        }
        if ($LASTEXITCODE -ne 0) { throw "Python仮想環境を作成できませんでした。" }
    }

    if (-not (Test-Path $BackendReadyFile)) {
        Write-Host "初回準備: バックエンドの依存関係をインストールしています..."
        & $PythonExe -m pip install -r (Join-Path $BackendDir "requirements.txt")
        if ($LASTEXITCODE -ne 0) { throw "バックエンドの依存関係をインストールできませんでした。" }
        New-Item -ItemType File -Force -Path $BackendReadyFile | Out-Null
    }

    $NodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    $NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $NodeCommand) { throw "Node.jsが見つかりません。Node.jsをインストールしてください。" }
    if (-not $NpmCommand) { throw "npmが見つかりません。Node.jsをインストールしてください。" }

    if (-not (Test-Path $ViteScript)) {
        Write-Host "初回準備: フロントエンドの依存関係をインストールしています..."
        Push-Location $FrontendDir
        try { & $NpmCommand.Source install }
        finally { Pop-Location }
        if ($LASTEXITCODE -ne 0) { throw "フロントエンドの依存関係をインストールできませんでした。" }
    }

    if (-not (Test-RecordedProcess $BackendPidFile)) {
        Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
        $BackendProcess = Start-Process -FilePath $PythonExe `
            -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
            -WorkingDirectory $BackendDir -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $LogDir "backend.log") `
            -RedirectStandardError (Join-Path $LogDir "backend-error.log")
        Set-Content -Path $BackendPidFile -Value $BackendProcess.Id
    }

    if (-not (Test-RecordedProcess $FrontendPidFile)) {
        Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
        $FrontendProcess = Start-Process -FilePath $NodeCommand.Source `
            -ArgumentList @($ViteScript) -WorkingDirectory $FrontendDir `
            -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $LogDir "frontend.log") `
            -RedirectStandardError (Join-Path $LogDir "frontend-error.log")
        Set-Content -Path $FrontendPidFile -Value $FrontendProcess.Id
    }

    Wait-ForUrl -Url "http://127.0.0.1:8000/docs" -Name "バックエンド"
    Wait-ForUrl -Url $AppUrl -Name "フロントエンド"
    Write-Host "起動しました。ブラウザを開きます。"
    Start-Process $AppUrl
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
