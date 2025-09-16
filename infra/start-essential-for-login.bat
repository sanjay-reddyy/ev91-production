@echo off
echo ============================================
echo    Starting Essential Services for Login
echo ============================================
echo.

echo Starting services needed for Admin Portal login...
echo.

echo 1. Starting Auth Service...
start "EV91-Auth" cmd /k "cd /d C:\voice_project\EV91-Platform\services\auth-service && npm run dev"

echo Waiting 5 seconds for Auth Service to start...
timeout /t 5 /nobreak >nul

echo 2. Starting API Gateway...
start "EV91-Gateway" cmd /k "cd /d C:\voice_project\EV91-Platform\apps\api-gateway && npm run dev"

echo Waiting 5 seconds for API Gateway to start...
timeout /t 5 /nobreak >nul

echo 3. Testing connection...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{\"email\":\"test\",\"password\":\"test\"}' -UseBasicParsing | Out-Null; Write-Host '✅ API Gateway is responding!' } catch { Write-Host '❌ API Gateway not ready yet - ' + $_.Exception.Message }"

echo.
echo ============================================
echo    Services Started!
echo ============================================
echo.
echo Your Admin Portal should now be able to connect to:
echo http://localhost:8000/api/auth/login
echo.
echo If you need to start the Admin Portal, run:
echo npm run dev
echo (from the apps/admin-portal directory)
echo.
pause
