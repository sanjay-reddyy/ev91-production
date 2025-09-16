@echo off
echo ============================================
echo    Starting Spare Parts Service (Port 4007)
echo ============================================
echo.

cd /d "C:\voice_project\EV91-Platform\services\spare-parts-service"

echo Checking .env file...
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please run setup first.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.
echo Starting Spare Parts Service...
echo Press Ctrl+C to stop the service
echo.

npm run dev
