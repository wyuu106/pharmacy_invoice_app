$ErrorActionPreference = "Stop"

$RunDir = Join-Path $PSScriptRoot ".run"

function Stop-RecordedProcess {
    param([string]$Name, [string]$PidFile)

    if (-not (Test-Path $PidFile)) {
        Write-Host "$Name is not running."
        return
    }

    $RecordedPid = (Get-Content $PidFile -Raw).Trim()
    if ($RecordedPid -match '^\d+$') {
        $Process = Get-Process `
            -Id ([int]$RecordedPid) `
            -ErrorAction SilentlyContinue
        if ($Process) {
            & taskkill.exe /PID $Process.Id /T /F | Out-Null
            Write-Host "$Name stopped."
        }
        else {
            Write-Host "$Name is already stopped."
        }
    }
    else {
        Write-Host "$Name has an invalid PID file. Removing it."
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

try {
    Write-Host "Stopping Pharmacy Invoice App..."
    Stop-RecordedProcess `
        -Name "Frontend" `
        -PidFile (Join-Path $RunDir "frontend.pid")
    Stop-RecordedProcess `
        -Name "Backend" `
        -PidFile (Join-Path $RunDir "backend.pid")
    Write-Host "The app has stopped."
    Start-Sleep -Seconds 1
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
