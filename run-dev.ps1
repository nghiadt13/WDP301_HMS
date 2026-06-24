# ============================================================
# run-dev.ps1 - Start both Backend & Frontend in one command
# Kills existing processes on the ports first to avoid conflicts
# ============================================================

$BackendPort = 9999
$FrontendPort = 5173

function Kill-PortProcess {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            if ($pid -ne 0) {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "[KILL] Port $Port -> PID $pid ($($proc.ProcessName))" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } else {
        Write-Host "[OK]   Port $Port is free" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WDP101 Dev Server Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing processes on both ports
Write-Host "[1/3] Freeing ports..." -ForegroundColor Cyan
Kill-PortProcess -Port $BackendPort
Kill-PortProcess -Port $FrontendPort

Start-Sleep -Seconds 1

# Step 2: Verify ports are free
Write-Host ""
Write-Host "[2/3] Verifying ports are free..." -ForegroundColor Cyan
$backendBusy = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
$frontendBusy = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue

if ($backendBusy) {
    Write-Host "[ERROR] Port $BackendPort is still in use!" -ForegroundColor Red
    exit 1
}
if ($frontendBusy) {
    Write-Host "[ERROR] Port $FrontendPort is still in use!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK]   All ports are free" -ForegroundColor Green

# Step 3: Start both services using concurrently
Write-Host ""
Write-Host "[3/3] Starting dev servers..." -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:$FrontendPort" -ForegroundColor White
Write-Host ""

Set-Location $PSScriptRoot
npm run dev
