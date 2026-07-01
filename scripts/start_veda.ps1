# VEDA Launcher PowerShell Script
Write-Host "=== Starting VEDA ===" -ForegroundColor Cyan

$backendDir = "$PSScriptRoot\..\backend"
$frontendDir = "$PSScriptRoot\..\frontend"

# Kill any existing VEDA processes
Get-Process -Name "python*","node*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
Write-Host "[1/3] Starting backend..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "C:\Program Files\Python314\python.exe" -ArgumentList "-m uvicorn app.main:app --port 8000" -WorkingDirectory $backendDir -WindowStyle Minimized -PassThru
Write-Host "[OK] Backend starting (PID: $($backend.Id))" -ForegroundColor Green

# Wait for backend
Write-Host "[2/3] Waiting for backend to be ready..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}
if (-not $ready) { Write-Host "[!] Backend failed to start" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Backend is ready!" -ForegroundColor Green

# Start frontend
Write-Host "[3/3] Starting frontend..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $frontendDir -WindowStyle Minimized -PassThru
Write-Host "[OK] Frontend starting (PID: $($frontend.Id))" -ForegroundColor Green

# Open browser
Start-Sleep -Seconds 10
Start-Process "http://localhost:3000"

Write-Host "`n=== VEDA is running! ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nClose this window to stop VEDA.`n" -ForegroundColor Yellow

# Keep alive
Read-Host "Press Enter to stop VEDA"
Get-Process -Name "python*","node*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "VEDA stopped." -ForegroundColor Cyan
