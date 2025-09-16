@echo off
echo 🚀 Starting EV91 Platform with Existing Database Data

echo.
echo ============================================================
echo   EV91 Platform - Docker Startup with Database Migration
echo ============================================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if backup file exists
if not exist "database-backup\ev91_backup.sql" (
    echo ⚠️  No database backup found!
    echo.
    echo Please export your existing database first:
    echo   1. Run: export-database.bat
    echo   2. Or manually place your backup file in: database-backup\ev91_backup.sql
    echo.
    set /p "CONTINUE=Continue without existing data? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        echo Exiting...
        pause
        exit /b 1
    )
) else (
    echo ✅ Found database backup file
    for %%A in (database-backup\ev91_backup.sql) do (
        echo    File size: %%~zA bytes
    )
)

echo.
echo 📋 Choose your environment:
echo   1. Development (Essential services only - 2GB RAM)
echo   2. Full Development (All services - 6GB RAM)  
echo   3. Production (All services with replicas - 8GB RAM)
echo.
set /p "ENV_CHOICE=Enter your choice (1-3): "

if "%ENV_CHOICE%"=="1" (
    set "ENVIRONMENT=dev"
    echo 🔧 Starting Development Environment...
) else if "%ENV_CHOICE%"=="2" (
    set "ENVIRONMENT=full"
    echo 🔧 Starting Full Development Environment...
) else if "%ENV_CHOICE%"=="3" (
    set "ENVIRONMENT=prod"
    echo 🔧 Starting Production Environment...
) else (
    set "ENVIRONMENT=dev"
    echo 🔧 Defaulting to Development Environment...
)

echo.
echo 🐳 Starting Docker services...
docker-manage.bat %ENVIRONMENT% up

if errorlevel 1 (
    echo ❌ Failed to start services!
    echo.
    echo 🔍 Troubleshooting steps:
    echo   1. Check Docker Desktop is running
    echo   2. Ensure no port conflicts (kill other apps using ports 3000-8000)
    echo   3. Check logs: docker-manage.bat %ENVIRONMENT% logs
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Services started successfully!
echo.
echo ⏳ Waiting for services to be healthy (this may take 1-2 minutes)...
timeout /t 30 /nobreak >nul

echo.
echo 🔍 Checking service health...

REM Check database
echo Checking database...
docker exec infra-postgres-1 pg_isready -U ev91user -d ev91db >nul 2>&1
if errorlevel 1 (
    echo ❌ Database not ready yet, please wait a bit longer
) else (
    echo ✅ Database is healthy
)

REM Check auth service
curl -s http://localhost:4001/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Auth service not ready yet
) else (
    echo ✅ Auth service is healthy
)

REM Check API gateway
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ API Gateway not ready yet
) else (
    echo ✅ API Gateway is healthy
)

echo.
echo 🌐 Service URLs:
if "%ENVIRONMENT%"=="dev" (
    echo   📱 Admin Portal:  http://localhost:3000
    echo   🔌 API Gateway:   http://localhost:8000
    echo   🔐 Auth Service:  http://localhost:4001
    echo   🗄️  Database:     localhost:5432 (ev91user/ev91pass)
) else (
    echo   📱 Admin Portal:  http://localhost:3000
    echo   🔌 API Gateway:   http://localhost:8000
    echo   🔐 Auth Service:  http://localhost:4001
    echo   👥 User Service:  http://localhost:3001
    echo   🏢 Team Service:  http://localhost:3002
    echo   🚗 Vehicle:       http://localhost:4004
    echo   🏍️  Rider:         http://localhost:6000
    echo   📦 Order:         http://localhost:3005
    echo   💳 Payment:       http://localhost:4003
    echo   📧 Notification:  http://localhost:3006
    echo   🏪 Client Store:  http://localhost:3004
    echo   📄 Template:      http://localhost:3007
    echo   🗄️  Database:     localhost:5432 (ev91user/ev91pass)
)

echo.
echo 📊 To monitor services:
echo   📋 Status:    docker-manage.bat %ENVIRONMENT% status
echo   📜 Logs:      docker-manage.bat %ENVIRONMENT% logs
echo   🛑 Stop:      docker-manage.bat %ENVIRONMENT% down
echo.

echo 🎉 EV91 Platform is ready! Your existing data has been preserved.
echo    Open http://localhost:3000 to access the admin portal.
echo.
pause
