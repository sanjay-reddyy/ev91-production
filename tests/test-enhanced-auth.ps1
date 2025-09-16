$baseUrl = "http://localhost:4001"

Write-Host "🚀 Testing Enhanced Auth Service Features" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check Success:" -ForegroundColor Green
    $healthResponse | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Sign Up
Write-Host "2. Testing Sign Up..." -ForegroundColor Yellow
$signUpData = @{
    email = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPass123!"
    confirmPassword = "TestPass123!"
    firstName = "Test"
    lastName = "User"
    phone = "+1234567890"
    acceptTerms = "true"
} | ConvertTo-Json

try {
    $signUpResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/signup" -Method POST -Body $signUpData -ContentType "application/json"
    Write-Host "✅ Sign Up Success:" -ForegroundColor Green
    $signUpResponse | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "❌ Sign Up Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 3: Password Reset Request
Write-Host "3. Testing Password Reset Request..." -ForegroundColor Yellow
$resetData = @{
    email = "superadmin@ev91.com"
} | ConvertTo-Json

try {
    $resetResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/forgot-password" -Method POST -Body $resetData -ContentType "application/json"
    Write-Host "✅ Password Reset Request Success:" -ForegroundColor Green
    $resetResponse | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "❌ Password Reset Request Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 4: Login
Write-Host "4. Testing Login..." -ForegroundColor Yellow
$loginData = @{
    email = "superadmin@ev91.com"
    password = "SuperAdmin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login Success:" -ForegroundColor Green
    $loginResponse | ConvertTo-Json -Depth 3
    
    # Test 5: Get Profile
    Write-Host ""
    Write-Host "5. Testing Get Profile..." -ForegroundColor Yellow
    $token = $loginResponse.data.tokens.accessToken
    $headers = @{ Authorization = "Bearer $token" }
    
    try {
        $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/profile" -Method GET -Headers $headers
        Write-Host "✅ Profile Success:" -ForegroundColor Green
        $profileResponse | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "❌ Profile Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🏁 Test Complete!" -ForegroundColor Green
