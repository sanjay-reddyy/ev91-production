@echo off
echo ============================================
echo    Starting Auth Service (Port 3001)
echo ============================================
echo.

cd /d "C:\voice_project\EV91-Platform\services\auth-service"

echo Checking .env file...
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please run setup first.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.
echo Starting Auth Service...
echo Press Ctrl+C to stop the service
echo.

npm run dev
