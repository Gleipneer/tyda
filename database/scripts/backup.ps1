# Deterministisk mysqldump av reflektionsarkiv (inga flytande versioner i output).
# Kräver: mysqldump i PATH (MySQL Client).
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$backupRoot = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path $repoRoot "backups" }
if (-not (Test-Path -LiteralPath $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

$stamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$outFile = Join-Path $backupRoot "reflektionsarkiv_$stamp.sql"

$hostName = if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { "127.0.0.1" }
$port = if ($env:MYSQL_PORT) { $env:MYSQL_PORT } else { "3306" }
$user = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "root" }
$db = "reflektionsarkiv"

$mysqlPwd = $env:MYSQL_PWD
if ($mysqlPwd) {
    $env:MYSQL_PWD = $mysqlPwd
}

$args = @(
    "-h", $hostName,
    "-P", $port,
    "-u", $user,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--default-character-set=utf8mb4",
    "--result-file=$outFile",
    $db
)

& mysqldump @args
if ($LASTEXITCODE -ne 0) {
    throw "mysqldump misslyckades med exitkod $LASTEXITCODE"
}

Write-Host "Backup skriven: $outFile"
