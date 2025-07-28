# Test Vehicle Service Integration
Write-Host "🔍 Testing Vehicle Service Integration..." -ForegroundColor Cyan
Write-Host ""

try {
    # Test health endpoint
    Write-Host "1. Testing health endpoint..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:4003/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Health check passed:" -ForegroundColor Green
    Write-Host ($healthResponse | ConvertTo-Json -Depth 2)
    
    # Test OEMs endpoint
    Write-Host ""
    Write-Host "2. Testing OEMs endpoint..." -ForegroundColor Yellow
    try {
        $oemsResponse = Invoke-RestMethod -Uri "http://localhost:4003/api/v1/oems" -Method Get -ErrorAction Stop
        Write-Host "✅ OEMs endpoint working: $($oemsResponse.Count) OEMs found" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ OEMs endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test Vehicle Models endpoint
    Write-Host ""
    Write-Host "3. Testing Vehicle Models endpoint..." -ForegroundColor Yellow
    try {
        $modelsResponse = Invoke-RestMethod -Uri "http://localhost:4003/api/v1/vehicle-models" -Method Get -ErrorAction Stop
        Write-Host "✅ Vehicle Models endpoint working: $($modelsResponse.Count) models found" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Vehicle Models endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test Vehicles endpoint
    Write-Host ""
    Write-Host "4. Testing Vehicles endpoint..." -ForegroundColor Yellow
    try {
        $vehiclesResponse = Invoke-RestMethod -Uri "http://localhost:4003/api/v1/vehicles" -Method Get -ErrorAction Stop
        $vehicleCount = if ($vehiclesResponse.data) { $vehiclesResponse.data.Count } else { $vehiclesResponse.Count }
        Write-Host "✅ Vehicles endpoint working: $vehicleCount vehicles found" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Vehicles endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test Damage Records endpoint
    Write-Host ""
    Write-Host "5. Testing Damage Records endpoint..." -ForegroundColor Yellow
    try {
        $damageResponse = Invoke-RestMethod -Uri "http://localhost:4003/api/v1/damage" -Method Get -ErrorAction Stop
        $damageCount = if ($damageResponse.data) { $damageResponse.data.Count } else { $damageResponse.Count }
        Write-Host "✅ Damage Records endpoint working: $damageCount damage records found" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Damage Records endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 Integration test completed!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Vehicle service not running: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Please start the vehicle service first:" -ForegroundColor Cyan
    Write-Host "   cd services/vehicle-service" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
}
