@echo off
echo ============================================
echo    Starting Client Store Service (Port 3003)
echo ============================================
echo.

cd /d "C:\voice_project\EV91-Platform\services\client-store-service"

echo Checking .env file...
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please run setup first.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.
echo Starting Client Store Service...
echo Press Ctrl+C to stop the service
echo.

npm run dev
