# VEDA Setup Script for Windows
param(
    [switch]$SkipDocker,
    [switch]$InitDB
)

Write-Host "=== VEDA Setup Script ===" -ForegroundColor Cyan
Write-Host ""

# Check requirements
function Test-Requirement {
    param($Name, $Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-Host "[✓] $Name found" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[✗] $Name not found" -ForegroundColor Red
        return $false
    }
}

Write-Host "Checking requirements..." -ForegroundColor Yellow
$requirements = @(
    @{Name="Docker"; Command="docker"},
    @{Name="Docker Compose"; Command="docker-compose"},
    @{Name="Python 3.11+"; Command="python"},
    @{Name="Node.js 20+"; Command="node"},
    @{Name="npm"; Command="npm"}
)

$allOk = $true
foreach ($req in $requirements) {
    if (-not (Test-Requirement $req.Name $req.Command)) {
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host "`nPlease install missing requirements and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Setup environment
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[✓] .env created" -ForegroundColor Green
} else {
    Write-Host "[✓] .env already exists" -ForegroundColor Green
}

if (-not $SkipDocker) {
    Write-Host "Starting Docker services..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "[✓] Docker services started" -ForegroundColor Green
}

# Backend setup
Write-Host "`nSetting up backend..." -ForegroundColor Yellow
Set-Location -LiteralPath "backend"
python -m venv venv
if ($IsWindows -or $env:OS) {
    .\venv\Scripts\Activate
} else {
    source venv/bin/activate
}
pip install -r requirements.txt
Set-Location -LiteralPath ".."

# Frontend setup
Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
Set-Location -LiteralPath "frontend"
npm install
Set-Location -LiteralPath ".."

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Run 'docker-compose up' to start all services" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
