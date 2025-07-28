$healthResponse = Invoke-RestMethod -Uri "http://localhost:3004/health" -Method Get
Write-Host "Health Check Response:" -ForegroundColor Green
$healthResponse | ConvertTo-Json

$clientData = @{
    clientCode = "TEST001"
    clientType = "restaurant"
    name = "Test Restaurant"
    primaryContactPerson = "John Doe"
    email = "test@example.com"
    phone = "+91-9876543210"
    gstNumber = "27AAAAA0000A1Z5"
    businessSize = "medium"
    baseOrderRate = 30.0
    bulkBonusEnabled = $false
    weeklyBonusEnabled = $false
    clientStatus = "active"
    clientPriority = "medium"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3004/api/clients" -Method Post -Body $clientData -ContentType "application/json"
    Write-Host "Client Creation Response:" -ForegroundColor Green
    $createResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Client Creation Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody"
    }
}

try {
    $getResponse = Invoke-RestMethod -Uri "http://localhost:3004/api/clients" -Method Get
    Write-Host "Get Clients Response:" -ForegroundColor Green
    $getResponse | ConvertTo-Json -Depth 2
} catch {
    Write-Host "Get Clients Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
