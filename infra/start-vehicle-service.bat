@echo off
echo ============================================
echo    Starting Vehicle Service (Port 4005)
echo ============================================
echo.

cd /d "C:\voice_project\EV91-Platform\services\vehicle-service"

echo Checking .env file...
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please run setup first.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.
echo Starting Vehicle Service...
echo Press Ctrl+C to stop the service
echo.

npm run dev
