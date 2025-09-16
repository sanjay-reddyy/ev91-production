# Test script for enhanced auth features in admin portal
Write-Host "🔧 Enhanced Auth Frontend Integration Test" -ForegroundColor Green

# Check if auth service is running
Write-Host "`n📡 Checking Auth Service Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Auth Service is running: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth Service is not accessible. Please start the auth service first." -ForegroundColor Red
    Write-Host "Run: docker-compose -f infra/docker-compose.dev.yml up auth-service -d" -ForegroundColor Yellow
    exit 1
}

# URLs to test (these should be accessible in the admin portal)
$testUrls = @(
    "http://localhost:5173",              # Default admin portal URL
    "http://localhost:5173/login",        # Login page
    "http://localhost:5173/signup",       # Sign up page
    "http://localhost:5173/forgot-password", # Forgot password page
    "http://localhost:5173/resend-verification" # Resend verification page
)

Write-Host "`n🌐 Testing Admin Portal Routes..." -ForegroundColor Yellow

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $url - Accessible" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $url - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $url - Not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n📝 Manual Testing Instructions:" -ForegroundColor Cyan
Write-Host "1. Open browser to: http://localhost:5173" -ForegroundColor White
Write-Host "2. Test Sign Up: Click 'Create Account' link" -ForegroundColor White
Write-Host "3. Test Forgot Password: Click 'Forgot Password?' link" -ForegroundColor White
Write-Host "4. Test Email Verification: Check console for verification links" -ForegroundColor White
Write-Host "5. Test Resend Verification: Use the resend verification form" -ForegroundColor White

Write-Host "`n🚀 To start the Admin Portal:" -ForegroundColor Cyan
Write-Host "cd apps/admin-portal; npm run dev" -ForegroundColor White

Write-Host "`n✨ Enhanced Auth Features Integrated!" -ForegroundColor Green
Write-Host "- Sign Up Form (/signup)" -ForegroundColor White
Write-Host "- Forgot Password (/forgot-password)" -ForegroundColor White
Write-Host "- Password Reset (/reset-password/:token)" -ForegroundColor White
Write-Host "- Email Verification (/verify-email/:token)" -ForegroundColor White
Write-Host "- Resend Verification (/resend-verification)" -ForegroundColor White
