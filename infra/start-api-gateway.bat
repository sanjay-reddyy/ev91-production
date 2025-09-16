@echo off
echo ============================================
echo    Starting API Gateway (Port 8000)
echo ============================================
echo.

cd /d "C:\voice_project\EV91-Platform\apps\api-gateway"

echo Checking .env file...
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please run setup first.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.
echo Starting API Gateway...
echo Press Ctrl+C to stop the service
echo.

npm run dev
