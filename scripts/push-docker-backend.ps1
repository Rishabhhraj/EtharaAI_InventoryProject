# Build and push backend image to Docker Hub (run when Docker Desktop is healthy)
param(
    [string]$Username = "blzxnakul44",
    [string]$ImageName = "ethara-inventory-api"
)

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\Docker\Docker\resources\bin;" + $env:Path

Write-Host "Checking Docker..." -ForegroundColor Cyan
docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Start Docker Desktop, wait until it is ready, then run this script again." -ForegroundColor Red
    exit 1
}

if (-not (docker login -u $Username 2>&1)) {
    Write-Host "Login failed. Use your Docker Hub personal access token as the password." -ForegroundColor Red
    exit 1
}

$tag = "${Username}/${ImageName}:latest"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Building $tag ..." -ForegroundColor Cyan
docker build -t $tag "$root\backend"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "Pushing $tag ..." -ForegroundColor Cyan
docker push $tag
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Done! Docker Hub link:" -ForegroundColor Green
Write-Host "https://hub.docker.com/r/$Username/$ImageName" -ForegroundColor White
