@echo off
echo ============================================
echo    EV91 Platform - Local PostgreSQL Setup
echo ============================================
echo.

echo 1. Setting up PostgreSQL database and user...
echo Please enter your PostgreSQL superuser password when prompted.
echo.

"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -f setup-local-postgres.sql

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to setup database. Make sure PostgreSQL is installed and running.
    echo.
    echo Installation help:
    echo 1. Download PostgreSQL 15 from: https://www.postgresql.org/download/windows/
    echo 2. During installation, set superuser password to: EV91SecurePass2025!
    echo 3. Keep default port 5432
    echo 4. Run this script again
    pause
    exit /b 1
)

echo.
echo ============================================
echo    Database setup completed successfully!
echo ============================================
echo.
echo Next steps:
echo 1. Run: setup-all-services.bat
echo 2. Start services individually or use: start-all-services.bat
echo.
pause
