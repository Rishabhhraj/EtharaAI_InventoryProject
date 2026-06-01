# One-time local setup: database, Python venv, env files
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PgBin = "C:\Program Files\PostgreSQL\16\bin"

if (Test-Path $PgBin) {
    $env:Path = "$PgBin;$env:Path"
}

Write-Host "=== Inventory IMS - Local Setup ===" -ForegroundColor Cyan

# Create DB user/database if missing
$dbExists = psql -U postgres -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname='inventory_db'" 2>$null
if ($dbExists -ne "1") {
    Write-Host "Creating database and user (you may be prompted for postgres password)..." -ForegroundColor Yellow
    $sql = @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'inventory') THEN
    CREATE USER inventory WITH PASSWORD 'inventory';
  END IF;
END `$`$;
SELECT 'CREATE DATABASE inventory_db OWNER inventory'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inventory_db')\gexec
"@
    # Simpler approach: run SQL file
    & psql -U postgres -h localhost -f "$PSScriptRoot\setup-local-db.sql"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "If prompted, enter the postgres password you set during PostgreSQL installation." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Database inventory_db already exists." -ForegroundColor Green
}

# Root .env
if (-not (Test-Path "$ProjectRoot\.env")) {
    Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
}

# Backend .env
$backendEnv = @"
DATABASE_URL=postgresql://inventory:inventory@localhost:5432/inventory_db
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DEBUG=true
"@
Set-Content -Path "$ProjectRoot\backend\.env" -Value $backendEnv -Encoding utf8

# Frontend .env
if (-not (Test-Path "$ProjectRoot\frontend\.env")) {
    Copy-Item "$ProjectRoot\frontend\.env.example" "$ProjectRoot\frontend\.env"
}

# Python venv
$venv = "$ProjectRoot\backend\.venv"
if (-not (Test-Path $venv)) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv $venv
}
& "$venv\Scripts\pip.exe" install -r "$ProjectRoot\backend\requirements.txt" -q
Write-Host "Backend dependencies installed." -ForegroundColor Green

# Frontend deps
if (-not (Test-Path "$ProjectRoot\frontend\node_modules")) {
    Push-Location "$ProjectRoot\frontend"
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "Setup complete. Run: .\scripts\start-local.ps1" -ForegroundColor Green
