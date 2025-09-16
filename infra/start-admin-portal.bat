@echo off
echo ============================================
echo    Starting Admin Portal (Port 5173)
echo ============================================
echo.

cd /d "C:\voice_project\EV91-Platform\apps\admin-portal"

echo Checking .env file...
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please run setup first.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.
echo Starting Admin Portal...
echo Press Ctrl+C to stop the service
echo.

npm run dev
