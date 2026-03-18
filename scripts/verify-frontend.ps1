param(
    [switch]$IncludeRuntime
)

$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot | Split-Path -Parent
$FrontendDir = Join-Path $Root "frontend"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    Write-Host ""
    Write-Host ("=== {0} ===" -f $Name) -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw ("Steget misslyckades: {0}" -f $Name)
    }
}

function Assert-RuntimeReady {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -Method GET -TimeoutSec 3
        if ($health.status -ne "ok") {
            throw "Backend health returnerade inte status=ok."
        }
        & curl.exe --silent --show-error --max-time 3 "http://127.0.0.1:5173/" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend svarade inte inom timeout."
        }
    } catch {
        throw "Runtime-verifiering kräver att backend och frontend redan kör. Starta .\scripts\start.ps1 först."
    }
}

Push-Location $FrontendDir
try {
    Invoke-Step "Frontend build" { npm run build }
    Invoke-Step "Frontend typecheck" { npm run typecheck }
    Invoke-Step "Frontend vitest" { npm run test }

    if ($IncludeRuntime) {
        Assert-RuntimeReady
        Invoke-Step "Frontend Playwright runtime" { npm run test:runtime }
    }
} finally {
    Pop-Location
}
