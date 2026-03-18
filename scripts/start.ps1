# Reflektionsarkiv – startskript (Windows PowerShell)
# Portar: backend 8000, frontend 5173
# Kör från projektroten: .\scripts\start.ps1

$ErrorActionPreference = "Stop"
$BackendPort = 8000
$FrontendPort = 5173
$Root = $PSScriptRoot | Split-Path -Parent

Write-Host ""
Write-Host "=== Tyda - Start ===" -ForegroundColor Cyan
Write-Host ""

# 1. Hitta och frigör portar + gamla processkedjor
function Get-PidsOnPort($port) {
    $lines = netstat -ano 2>$null | Select-String "LISTENING" | Select-String ":$port\s"
    $pids = @()
    foreach ($line in $lines) {
        if ($line -match '\s+(\d+)\s*$') { $pids += [int]$Matches[1] }
    }
    $pids | Sort-Object -Unique
}

function Stop-ProcessTree($processId) {
    if (-not $processId) { return }
    if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
        cmd /c "taskkill /PID $processId /T /F >nul 2>nul" | Out-Null
    }
}

function Stop-OrphanedSpawnChildren($parentIds) {
    foreach ($parentId in ($parentIds | Sort-Object -Unique)) {
        $childProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -eq "python.exe" -and
            $_.CommandLine -like "*spawn_main(parent_pid=$parentId*"
        }
        foreach ($child in $childProcs) {
            try {
                Stop-Process -Id $child.ProcessId -Force -ErrorAction Stop
            } catch {
            }
        }
    }
}

function Stop-BackendProcesses($port, $backendDir) {
    $portPids = @(Get-PidsOnPort $port)
    $projectProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
        ($_.CommandLine -like "*$backendDir*app.main:app*") -or
        ($_.ExecutablePath -like "*$backendDir\venv\Scripts\python.exe")
    }

    $allIds = @($portPids + ($projectProcs | ForEach-Object { $_.ProcessId })) | Sort-Object -Unique
    if ($allIds.Count -gt 0) {
        Write-Host ('[Port ' + $port + '] Stoppar backend-process(er): ' + ($allIds -join ', ')) -ForegroundColor Yellow
        foreach ($procId in $allIds) {
            Stop-ProcessTree $procId
        }
        Stop-OrphanedSpawnChildren $allIds
        Start-Sleep -Seconds 2
    } else {
        Write-Host ('[Port ' + $port + '] Ledig') -ForegroundColor Green
    }
}

function Stop-FrontendProcesses($port, $frontendDir) {
    $portPids = @(Get-PidsOnPort $port)
    $projectProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*$frontendDir*" -and $_.CommandLine -like "*vite*"
    }

    $allIds = @($portPids + ($projectProcs | ForEach-Object { $_.ProcessId })) | Sort-Object -Unique
    if ($allIds.Count -gt 0) {
        Write-Host ('[Port ' + $port + '] Stoppar frontend-process(er): ' + ($allIds -join ', ')) -ForegroundColor Yellow
        foreach ($procId in $allIds) {
            Stop-ProcessTree $procId
        }
        Start-Sleep -Seconds 2
    } else {
        Write-Host ('[Port ' + $port + '] Ledig') -ForegroundColor Green
    }
}

function Wait-ForBackend($port) {
    $url = "http://127.0.0.1:$port/api/health"
    for ($i = 0; $i -lt 20; $i++) {
        try {
            $res = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 2
            if ($res.status -eq "ok") {
                return $true
            }
        } catch {
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"

Stop-BackendProcesses $BackendPort $BackendDir
Stop-FrontendProcesses $FrontendPort $FrontendDir

Write-Host ""

# 2. Starta backend
$VenvPython = Join-Path $BackendDir "venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Host "FEL: Hittar inte venv. Kor forst: cd backend; python -m venv venv; pip install -r requirements.txt" -ForegroundColor Red
    exit 1
}

Write-Host ("[Backend] Startar uvicorn pa port {0}..." -f $BackendPort) -ForegroundColor Cyan
# Kor utan --reload for att undvika hangande barnprocesser pa Windows.
$backendProc = Start-Process -FilePath $VenvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", $BackendPort -WorkingDirectory $BackendDir -WindowStyle Hidden -PassThru
Write-Host ('[Backend] PID ' + $backendProc.Id) -ForegroundColor Green

if (-not (Wait-ForBackend $BackendPort)) {
    Write-Host ("FEL: Backend svarar inte pa http://127.0.0.1:{0}/api/health" -f $BackendPort) -ForegroundColor Red
    Stop-ProcessTree $backendProc.Id
    exit 1
}

Start-Sleep -Milliseconds 500

# 3. Starta frontend
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "[Frontend] Forsta gangen - kor npm install..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    npm install
    Pop-Location
}

Write-Host ""
Write-Host ("[Frontend] Startar Vite pa port {0}..." -f $FrontendPort) -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://127.0.0.1:$BackendPort" -ForegroundColor White
Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host ""
Write-Host "  Tryck Ctrl+C for att stoppa frontend. Backend fortsatter kora." -ForegroundColor Gray
Write-Host ""

Push-Location $FrontendDir
try {
    npm run dev
} finally {
    Pop-Location
}
