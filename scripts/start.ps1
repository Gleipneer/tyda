# Tyda – robust startskript (Windows PowerShell)
# Kör från projektroten: .\scripts\start.ps1

$ErrorActionPreference = "Stop"
$BackendPort = 8000
$FrontendPort = 5173
$Root = $PSScriptRoot | Split-Path -Parent
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"
$BackendEnvPath = Join-Path $BackendDir ".env"
$BackendEnvExamplePath = Join-Path $BackendDir ".env.example"
$RequirementsPath = Join-Path $BackendDir "requirements.txt"
$ReflektionsarkivSqlPath = Join-Path $Root "reflektionsarkiv.sql"
$VenvDir = Join-Path $BackendDir "venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$BackendDepsMarker = Join-Path $VenvDir ".requirements.sha256"
$FrontendDepsMarker = Join-Path $FrontendDir "node_modules\.package-lock.sha256"
$CompanionPath = Join-Path $Root "KOMPANJON.md"

Write-Host ""
Write-Host "=== Tyda - Start ===" -ForegroundColor Cyan
Write-Host ""

function Stop-WithMessage($message) {
    Write-Host ""
    Write-Host "FEL: $message" -ForegroundColor Red
    if (Test-Path $CompanionPath) {
        Write-Host "Las vidare i KOMPANJON.md i projektroten." -ForegroundColor Yellow
    }
    exit 1
}

function Get-CommandPath($names) {
    foreach ($name in $names) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd) {
            return $cmd.Source
        }
    }
    return $null
}

function Get-PythonBootstrap() {
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        return @{ Command = $py.Source; Args = @("-3") }
    }

    $python = Get-CommandPath @("python", "python3")
    if ($python) {
        return @{ Command = $python; Args = @() }
    }

        Stop-WithMessage "Hittar inte Python. Installera Python 3.11+ och kor sedan skriptet igen."
}

function Copy-IfMissing($source, $target, $label) {
    if (-not (Test-Path $target)) {
        Copy-Item $source $target
        Write-Host "[$label] Skapade $(Split-Path $target -Leaf) fran mallfil." -ForegroundColor Yellow
    }
}

function Read-DotEnv($path) {
    $values = @{}
    if (-not (Test-Path $path)) {
        return $values
    }

    foreach ($line in Get-Content $path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) {
            continue
        }
        $parts = $trimmed -split "=", 2
        if ($parts.Count -eq 2) {
            $values[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $values
}

function Get-EnvValue($map, $key, $defaultValue) {
    if ($map.ContainsKey($key) -and $map[$key] -ne "") {
        return $map[$key]
    }
    return $defaultValue
}

function Invoke-Checked($filePath, $arguments, $workingDirectory, $label) {
    Push-Location $workingDirectory
    try {
        & $filePath @arguments
        if ($LASTEXITCODE -ne 0) {
            Stop-WithMessage "$label misslyckades."
        }
    } finally {
        Pop-Location
    }
}

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

function Wait-ForHttpJson($url, $propertyName, $expectedValue) {
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $res = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 2
            if ($null -eq $propertyName) {
                return $true
            }
            if ($res.$propertyName -eq $expectedValue) {
                return $true
            }
        } catch {
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Initialize-BackendVenv() {
    $bootstrap = Get-PythonBootstrap
    if (-not (Test-Path $VenvPython)) {
        Write-Host "[Backend] Skapar virtuell miljo..." -ForegroundColor Yellow
        Invoke-Checked $bootstrap.Command ($bootstrap.Args + @("-m", "venv", $VenvDir)) $BackendDir "Skapande av virtuell miljo"
    }

    $requirementsHash = (Get-FileHash $RequirementsPath -Algorithm SHA256).Hash
    $installedHash = if (Test-Path $BackendDepsMarker) { (Get-Content $BackendDepsMarker -Raw).Trim() } else { "" }
    if ($requirementsHash -ne $installedHash) {
        Write-Host "[Backend] Installerar Python-paket..." -ForegroundColor Yellow
        Invoke-Checked $VenvPython @("-m", "pip", "install", "-r", $RequirementsPath) $BackendDir "Installation av backendpaket"
        Set-Content -Path $BackendDepsMarker -Value $requirementsHash -NoNewline
    }
}

function Install-FrontendDependencies() {
    $npm = Get-CommandPath @("npm.cmd", "npm")
    if (-not $npm) {
        Stop-WithMessage "Hittar inte npm. Installera Node.js 20+ och kor sedan skriptet igen."
    }

    $packageLockPath = Join-Path $FrontendDir "package-lock.json"
    $packageLockHash = (Get-FileHash $packageLockPath -Algorithm SHA256).Hash
    $installedHash = if (Test-Path $FrontendDepsMarker) { (Get-Content $FrontendDepsMarker -Raw).Trim() } else { "" }
    if (-not (Test-Path (Join-Path $FrontendDir "node_modules")) -or $packageLockHash -ne $installedHash) {
        Write-Host "[Frontend] Installerar npm-paket..." -ForegroundColor Yellow
        Invoke-Checked $npm @("install") $FrontendDir "Installation av frontendpaket"
        if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
            Stop-WithMessage "Frontendpaket installerades inte korrekt."
        }
        Set-Content -Path $FrontendDepsMarker -Value $packageLockHash -NoNewline
    }
}

function Initialize-DatabaseReady() {
    $mysql = Get-CommandPath @("mysql.exe", "mysql")
    if (-not $mysql) {
        Write-Host "[Databas] mysql-klienten hittades inte. Hoppar over automatisk import." -ForegroundColor Yellow
        return
    }

    $envValues = Read-DotEnv $BackendEnvPath
    $dbHost = Get-EnvValue $envValues "DB_HOST" "localhost"
    $dbPort = Get-EnvValue $envValues "DB_PORT" "3306"
    $dbName = Get-EnvValue $envValues "DB_NAME" "reflektionsarkiv"
    $dbUser = Get-EnvValue $envValues "DB_USER" "root"
    $dbPassword = Get-EnvValue $envValues "DB_PASSWORD" ""

    $queryArgs = @("--protocol=TCP", "--host=$dbHost", "--port=$dbPort", "--user=$dbUser", "--batch", "--skip-column-names", "-e", "SHOW DATABASES LIKE '$dbName';")
    $previousPwd = $env:MYSQL_PWD
    try {
        if ($dbPassword -ne "") {
            $env:MYSQL_PWD = $dbPassword
        } else {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }

        $dbExists = & $mysql @queryArgs 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[Databas] Kunde inte ansluta med mysql-klienten (fel DB_USER/DB_PASSWORD eller ingen TCP-access)." -ForegroundColor Yellow
            Write-Host "         Importera reflektionsarkiv.sql manuellt och satt ratt backend\.env. Fortsatter; backend ger fel om DB saknas." -ForegroundColor Yellow
            return
        }

        if (($dbExists | Out-String).Trim() -ne $dbName) {
            Write-Host "[Databas] Skapar databasen fran reflektionsarkiv.sql..." -ForegroundColor Yellow
            Get-Content -Raw $ReflektionsarkivSqlPath | & $mysql "--protocol=TCP" "--host=$dbHost" "--port=$dbPort" "--user=$dbUser"
            if ($LASTEXITCODE -ne 0) {
                Stop-WithMessage "Automatisk import av reflektionsarkiv.sql misslyckades. Kontrollera DB_HOST, DB_USER och DB_PASSWORD i backend\.env."
            }
        }
    } finally {
        if ($null -ne $previousPwd) {
            $env:MYSQL_PWD = $previousPwd
        } else {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }
    }
}

Copy-IfMissing $BackendEnvExamplePath $BackendEnvPath "Backend"
Initialize-BackendVenv
Install-FrontendDependencies
Initialize-DatabaseReady

Stop-BackendProcesses $BackendPort $BackendDir
Stop-FrontendProcesses $FrontendPort $FrontendDir

Write-Host ""
Write-Host ("[Backend] Startar uvicorn pa port {0}..." -f $BackendPort) -ForegroundColor Cyan
# 0.0.0.0: same as start.sh — reachable from Tailscale/LAN, not only localhost
$backendProc = Start-Process -FilePath $VenvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", $BackendPort -WorkingDirectory $BackendDir -WindowStyle Hidden -PassThru
Write-Host ('[Backend] PID ' + $backendProc.Id) -ForegroundColor Green

if (-not (Wait-ForHttpJson "http://127.0.0.1:$BackendPort/api/health" "status" "ok")) {
    Stop-ProcessTree $backendProc.Id
    Stop-WithMessage "Backend svarar inte pa /api/health."
}

if (-not (Wait-ForHttpJson "http://127.0.0.1:$BackendPort/api/db-health" "status" "ok")) {
    Stop-ProcessTree $backendProc.Id
    Stop-WithMessage "Backend nar databasen inte. Kontrollera backend\.env och att MySQL kor."
}

Write-Host ""
Write-Host ("[Frontend] Startar Vite pa port {0}..." -f $FrontendPort) -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://127.0.0.1:$BackendPort" -ForegroundColor White
Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor White
$tsIp = $null
try {
    $tsCmd = Get-Command tailscale -ErrorAction SilentlyContinue
    if ($tsCmd) {
        $tsIp = (& tailscale ip -4 2>$null | Select-Object -First 1)
        if ($tsIp) { $tsIp = $tsIp.Trim() }
    }
} catch {}
if ($tsIp) {
    Write-Host "  (Tailscale IPv4) Backend:  http://${tsIp}:$BackendPort" -ForegroundColor Cyan
    Write-Host "  (Tailscale IPv4) Frontend: http://${tsIp}:$FrontendPort" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  Tryck Ctrl+C for att stoppa frontend. Backend fortsatter kora." -ForegroundColor Gray
Write-Host ""

$npmCommand = Get-CommandPath @("npm.cmd", "npm")
Push-Location $FrontendDir
try {
    & $npmCommand run dev
} finally {
    Pop-Location
}
