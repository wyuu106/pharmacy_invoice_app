$ErrorActionPreference = "Stop"

$RunDir = Join-Path $PSScriptRoot ".run"

function Stop-RecordedProcess {
    param([string]$Name, [string]$PidFile)

    if (-not (Test-Path $PidFile)) {
        Write-Host "$Nameは起動していません。"
        return
    }

    $RecordedPid = (Get-Content $PidFile -Raw).Trim()
    if ($RecordedPid -match '^\d+$') {
        $Process = Get-Process -Id ([int]$RecordedPid) -ErrorAction SilentlyContinue
        if ($Process) {
            Stop-Process -Id $Process.Id -Force
            Write-Host "$Nameを停止しました。"
        }
        else {
            Write-Host "$Nameはすでに停止しています。"
        }
    }
    else {
        Write-Host "$NameのPIDファイルが不正なため削除します。"
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

try {
    Write-Host "薬局請求書アプリを停止しています..."
    Stop-RecordedProcess -Name "フロントエンド" -PidFile (Join-Path $RunDir "frontend.pid")
    Stop-RecordedProcess -Name "バックエンド" -PidFile (Join-Path $RunDir "backend.pid")
    Write-Host "停止しました。"
    Start-Sleep -Seconds 1
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
