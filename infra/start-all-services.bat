@echo off
echo ============================================
echo    EV91 Platform - Start All Services
echo ============================================
echo.

echo This will start all services in separate command windows.
echo Make sure you have run setup-all-services.bat first!
echo.
pause

echo Starting services...

echo 1. Starting Auth Service...
start "Auth Service" cmd /k "C:\voice_project\EV91-Platform\infra\start-auth-service.bat"
timeout /t 3 /nobreak >nul

echo 2. Starting Team Service...
start "Team Service" cmd /k "C:\voice_project\EV91-Platform\infra\start-team-service.bat"
timeout /t 3 /nobreak >nul

echo 3. Starting Client Store Service...
start "Client Store Service" cmd /k "C:\voice_project\EV91-Platform\infra\start-client-store-service.bat"
timeout /t 3 /nobreak >nul

echo 4. Starting Rider Service...
start "Rider Service" cmd /k "C:\voice_project\EV91-Platform\infra\start-rider-service.bat"
timeout /t 3 /nobreak >nul

echo 5. Starting Vehicle Service...
start "Vehicle Service" cmd /k "C:\voice_project\EV91-Platform\infra\start-vehicle-service.bat"
timeout /t 3 /nobreak >nul

echo 6. Starting API Gateway...
start "API Gateway" cmd /k "C:\voice_project\EV91-Platform\infra\start-api-gateway.bat"
timeout /t 5 /nobreak >nul

echo 7. Starting Admin Portal...
start "Admin Portal" cmd /k "C:\voice_project\EV91-Platform\infra\start-admin-portal.bat"

echo 8. Starting Spare Parts Service...
start "Spare Parts Service" cmd /k "C:\voice_project\EV91-Platform\infra\start-spare-parts-service.bat"

echo.
echo ============================================
echo    ✅ All Services Started!
echo ============================================
echo.
echo Services should be starting in separate windows:
echo - Auth Service: http://localhost:3001
echo - Team Service: http://localhost:3002
echo - Client Store Service: http://localhost:3003
echo - Rider Service: http://localhost:3004
echo - Vehicle Service: http://localhost:3005
echo - API Gateway: http://localhost:8000
echo - Admin Portal: http://localhost:5173
echo - Spare Parts Service: http://localhost:4006
echo.
echo Wait a few moments for all services to fully start,
echo then visit: http://localhost:5173 for the Admin Portal
echo.
pause
