param(
    [Parameter(Mandatory = $true)]
    [string]$NpmCommandPath
)

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
$BackendReadyFile = Join-Path `
    $BackendDir `
    ".venv\.dependencies-installed"
$ViteScript = Join-Path $FrontendDir "node_modules\vite\bin\vite.js"
$AppUrl = "http://localhost:5174/invoice"

New-Item -ItemType Directory -Force -Path $RunDir, $LogDir | Out-Null

function Test-RecordedProcess {
    param([string]$PidFile)
    if (-not (Test-Path $PidFile)) { return $false }
    $RecordedPid = (Get-Content $PidFile -Raw).Trim()
    if ($RecordedPid -notmatch '^\d+$') { return $false }
    $Process = Get-Process `
        -Id ([int]$RecordedPid) `
        -ErrorAction SilentlyContinue
    return $null -ne $Process
}

function Wait-ForUrl {
    param([string]$Url, [string]$Name)
    for ($Attempt = 0; $Attempt -lt 60; $Attempt++) {
        try {
            Invoke-WebRequest `
                -Uri $Url `
                -UseBasicParsing `
                -TimeoutSec 2 | Out-Null
            return
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }
    throw "$Name did not start. Check the files in scripts\logs."
}

try {
    Write-Host "Starting Pharmacy Invoice App..."

    if (-not (Test-Path $PythonExe)) {
        $PythonLauncher = Get-Command py.exe -ErrorAction SilentlyContinue
        if ($PythonLauncher) {
            & $PythonLauncher.Source -3 -m venv (Join-Path $BackendDir ".venv")
        }
        else {
            $PythonCommand = Get-Command `
                python.exe `
                -ErrorAction SilentlyContinue
            if (-not $PythonCommand) {
                throw "Python 3 was not found. Install Python 3 first."
            }
            & $PythonCommand.Source `
                -m venv `
                (Join-Path $BackendDir ".venv")
        }
        if ($LASTEXITCODE -ne 0) {
            throw "Could not create the Python virtual environment."
        }
    }

    if (-not (Test-Path $BackendReadyFile)) {
        Write-Host "Installing backend dependencies..."
        $Requirements = Join-Path $BackendDir "requirements.txt"
        & $PythonExe -m pip install -r $Requirements
        if ($LASTEXITCODE -ne 0) {
            throw "Could not install the backend dependencies."
        }
        New-Item `
            -ItemType File `
            -Force `
            -Path $BackendReadyFile | Out-Null
    }

    if (-not (Test-Path $NpmCommandPath -PathType Leaf)) {
        throw "npm.cmd was not found. Install Node.js first."
    }

    if (-not (Test-Path $ViteScript)) {
        Write-Host "Installing frontend dependencies..."
        Push-Location $FrontendDir
        try {
            & $NpmCommandPath install
        }
        finally {
            Pop-Location
        }
        if ($LASTEXITCODE -ne 0) {
            throw "Could not install the frontend dependencies."
        }
    }

    if (-not (Test-RecordedProcess $BackendPidFile)) {
        Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
        $BackendArgs = @(
            "-m", "uvicorn", "app.main:app",
            "--host", "127.0.0.1", "--port", "8000"
        )
        $BackendProcess = Start-Process `
            -FilePath $PythonExe `
            -ArgumentList $BackendArgs `
            -WorkingDirectory $BackendDir `
            -WindowStyle Hidden `
            -PassThru `
            -RedirectStandardOutput `
                (Join-Path $LogDir "backend.log") `
            -RedirectStandardError (Join-Path $LogDir "backend-error.log")
        Set-Content -Path $BackendPidFile -Value $BackendProcess.Id
    }

    if (-not (Test-RecordedProcess $FrontendPidFile)) {
        Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
        $FrontendProcess = Start-Process `
            -FilePath $NpmCommandPath `
            -ArgumentList @("run", "dev") `
            -WorkingDirectory $FrontendDir `
            -WindowStyle Hidden `
            -PassThru `
            -RedirectStandardOutput `
                (Join-Path $LogDir "frontend.log") `
            -RedirectStandardError `
                (Join-Path $LogDir "frontend-error.log")
        Set-Content -Path $FrontendPidFile -Value $FrontendProcess.Id
    }

    Wait-ForUrl `
        -Url "http://127.0.0.1:8000/docs" `
        -Name "Backend"
    Wait-ForUrl -Url $AppUrl -Name "Frontend"
    Write-Host "The app is ready. Opening the browser..."
    Start-Process $AppUrl
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
