@echo off
echo ============================================
echo    EV91 Platform - Setup All Services
echo ============================================
echo.

echo Installing dependencies for all services...
echo.

echo 1. Installing Auth Service dependencies...
cd /d "C:\voice_project\EV91-Platform\services\auth-service"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Auth Service npm install failed!
    pause
    exit /b 1
)
echo ✅ Auth Service dependencies installed

echo.
echo 2. Installing Team Service dependencies...
cd /d "C:\voice_project\EV91-Platform\services\team-service"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Team Service npm install failed!
    pause
    exit /b 1
)
echo ✅ Team Service dependencies installed

echo.
echo 3. Installing Client Store Service dependencies...
cd /d "C:\voice_project\EV91-Platform\services\client-store-service"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Client Store Service npm install failed!
    pause
    exit /b 1
)
echo ✅ Client Store Service dependencies installed

echo.
echo 4. Installing Rider Service dependencies...
cd /d "C:\voice_project\EV91-Platform\services\rider-service"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Rider Service npm install failed!
    pause
    exit /b 1
)
echo ✅ Rider Service dependencies installed

echo.
echo 5. Installing Vehicle Service dependencies...
cd /d "C:\voice_project\EV91-Platform\services\vehicle-service"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Vehicle Service npm install failed!
    pause
    exit /b 1
)
echo ✅ Vehicle Service dependencies installed

echo.
echo 6. Installing API Gateway dependencies...
cd /d "C:\voice_project\EV91-Platform\apps\api-gateway"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ API Gateway npm install failed!
    pause
    exit /b 1
)
echo ✅ API Gateway dependencies installed

echo.
echo 7. Installing Admin Portal dependencies...
cd /d "C:\voice_project\EV91-Platform\apps\admin-portal"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Admin Portal npm install failed!
    pause
    exit /b 1
)
echo ✅ Admin Portal dependencies installed

echo.
echo ============================================
echo    ✅ All Services Setup Complete!
echo ============================================
echo.
echo You can now start individual services using:
echo - infra\start-auth-service.bat
echo - infra\start-team-service.bat
echo - infra\start-client-store-service.bat
echo - infra\start-rider-service.bat
echo - infra\start-vehicle-service.bat
echo - infra\start-api-gateway.bat
echo - infra\start-admin-portal.bat
echo.
echo Or use the VS Code tasks.
echo.
pause
