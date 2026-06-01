# Start API and frontend for local development
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PgBin = "C:\Program Files\PostgreSQL\16\bin"
if (Test-Path $PgBin) { $env:Path = "$PgBin;$env:Path" }

if (-not (Test-Path "$ProjectRoot\backend\.env")) {
    Write-Host "Run .\scripts\setup-local.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Inventory IMS locally..." -ForegroundColor Cyan
Write-Host "  API:      http://localhost:8000" -ForegroundColor White
Write-Host "  API docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""

$backendCmd = @"
Set-Location '$ProjectRoot\backend'
& '$ProjectRoot\backend\.venv\Scripts\Activate.ps1'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

$frontendCmd = @"
Set-Location '$ProjectRoot\frontend'
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "Started backend and frontend in new windows." -ForegroundColor Green
