# Test script for enhanced auth features in admin portal
Write-Host "Enhanced Auth Frontend Integration Test" -ForegroundColor Green

# Check if auth service is running
Write-Host "`nChecking Auth Service Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/health" -Method GET -TimeoutSec 5
    Write-Host "Auth Service is running: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "Auth Service is not accessible. Please start the auth service first." -ForegroundColor Red
    Write-Host "Run: docker-compose -f infra/docker-compose.dev.yml up auth-service -d" -ForegroundColor Yellow
    exit 1
}

# URLs to test (these should be accessible in the admin portal)
$testUrls = @(
    "http://localhost:5173",
    "http://localhost:5173/login",
    "http://localhost:5173/signup",
    "http://localhost:5173/forgot-password",
    "http://localhost:5173/resend-verification"
)

Write-Host "`nTesting Admin Portal Routes..." -ForegroundColor Yellow

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "OK: $url" -ForegroundColor Green
        } else {
            Write-Host "Warning: $url - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error: $url - Not accessible" -ForegroundColor Red
    }
}

Write-Host "`nManual Testing Instructions:" -ForegroundColor Cyan
Write-Host "1. Open browser to: http://localhost:5173" -ForegroundColor White
Write-Host "2. Test Sign Up: Click Create Account link" -ForegroundColor White
Write-Host "3. Test Forgot Password: Click Forgot Password link" -ForegroundColor White
Write-Host "4. Test Email Verification: Check console for verification links" -ForegroundColor White
Write-Host "5. Test Resend Verification: Use the resend verification form" -ForegroundColor White

Write-Host "`nTo start the Admin Portal:" -ForegroundColor Cyan
Write-Host "cd apps/admin-portal" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White

Write-Host "`nEnhanced Auth Features Integrated:" -ForegroundColor Green
Write-Host "- Sign Up Form (/signup)" -ForegroundColor White
Write-Host "- Forgot Password (/forgot-password)" -ForegroundColor White
Write-Host "- Password Reset (/reset-password/:token)" -ForegroundColor White
Write-Host "- Email Verification (/verify-email/:token)" -ForegroundColor White
Write-Host "- Resend Verification (/resend-verification)" -ForegroundColor White
