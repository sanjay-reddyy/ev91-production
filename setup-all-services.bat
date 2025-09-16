@echo off
echo ============================================
echo    EV91 Platform - Service Setup
echo ============================================
echo.

set "BASE_DIR=C:\voice_project\EV91-Platform"

echo 1. Installing dependencies for all services...
echo.

echo Installing Auth Service dependencies...
cd "%BASE_DIR%\services\auth-service"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install auth-service dependencies
    pause
    exit /b 1
)

echo Installing Team Service dependencies...
cd "%BASE_DIR%\services\team-service"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install team-service dependencies
    pause
    exit /b 1
)

echo Installing Vehicle Service dependencies...
cd "%BASE_DIR%\services\vehicle-service"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install vehicle-service dependencies
    pause
    exit /b 1
)

echo Installing Client Store Service dependencies...
cd "%BASE_DIR%\services\client-store-service"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client-store-service dependencies
    pause
    exit /b 1
)

echo Installing Rider Service dependencies...
cd "%BASE_DIR%\services\rider-service"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install rider-service dependencies
    pause
    exit /b 1
)

echo Installing API Gateway dependencies...
cd "%BASE_DIR%\apps\api-gateway"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install api-gateway dependencies
    pause
    exit /b 1
)

echo.
echo 2. Generating Prisma clients and pushing schemas...
echo.

echo Pushing Auth Service schema...
cd "%BASE_DIR%\services\auth-service"
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup auth-service database
    pause
    exit /b 1
)

echo Pushing Team Service schema...
cd "%BASE_DIR%\services\team-service"
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup team-service database
    pause
    exit /b 1
)

echo Pushing Vehicle Service schema...
cd "%BASE_DIR%\services\vehicle-service"
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup vehicle-service database
    pause
    exit /b 1
)

echo Pushing Client Store Service schema...
cd "%BASE_DIR%\services\client-store-service"
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup client-store-service database
    pause
    exit /b 1
)

echo Pushing Rider Service schema...
cd "%BASE_DIR%\services\rider-service"
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Failed to setup rider-service database
    pause
    exit /b 1
)

echo.
echo ============================================
echo    All services setup completed successfully!
echo ============================================
echo.
echo You can now start services using:
echo - start-all-services.bat (starts all services)
echo - Or start each service individually in separate terminals
echo.
pause
