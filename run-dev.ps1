# ============================================================
# run-dev.ps1 - Start both Backend & Frontend in one command
# Kills existing processes on the ports first to avoid conflicts
# ============================================================

$BackendPort = 9999
$FrontendPort = 5173

function Kill-PortProcess {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -ne 0) {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "[KILL] Port $Port -> PID $procId ($($proc.ProcessName))" -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
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

# Step 2: Verify ports are free, retry kill if still busy
Write-Host ""
Write-Host "[2/3] Verifying ports are free..." -ForegroundColor Cyan
$maxRetries = 3

foreach ($port in @($BackendPort, $FrontendPort)) {
    for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
        $busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if (-not $busy) {
            Write-Host "[OK]   Port $port is free" -ForegroundColor Green
            break
        }
        if ($attempt -lt $maxRetries) {
            Write-Host "[WARN] Port $port still in use (attempt $attempt/$maxRetries), retrying kill..." -ForegroundColor Yellow
            Kill-PortProcess -Port $port
            Start-Sleep -Seconds 2
        } else {
            Write-Host "[ERROR] Port $port is still in use after $maxRetries attempts!" -ForegroundColor Red
            exit 1
        }
    }
}

# Step 3: Start both services using concurrently
Write-Host ""
Write-Host "[3/3] Starting dev servers..." -ForegroundColor Cyan
Write-Host "  Backend  -> http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:$FrontendPort" -ForegroundColor White
Write-Host ""

Set-Location $PSScriptRoot
npm run dev
