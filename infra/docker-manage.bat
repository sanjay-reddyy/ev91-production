@echo off
setlocal enabledelayedexpansion

REM EV91 Platform Docker Management Script for Windows

set "ENVIRONMENT=%1"
set "COMMAND=%2"

REM Handle help command first
if "%ENVIRONMENT%"=="help" goto :usage
if "%COMMAND%"=="help" goto :usage

if "%ENVIRONMENT%"=="" set "ENVIRONMENT=dev"
if "%COMMAND%"=="" set "COMMAND=up"

REM Set compose file based on environment
if "%ENVIRONMENT%"=="dev" (
    set "COMPOSE_FILE=docker-compose.dev.yml"
    set "ENV_FILE=.env.dev"
    echo Using development environment ^(essential services only^)
) else if "%ENVIRONMENT%"=="full" (
    set "COMPOSE_FILE=docker-compose.full.yml"
    set "ENV_FILE=.env.dev"
    echo Using full development environment ^(all services^)
) else if "%ENVIRONMENT%"=="prod" (
    set "COMPOSE_FILE=docker-compose.prod.yml"
    set "ENV_FILE=.env.prod"
    echo Using production environment
) else (
    echo Invalid environment. Use: dev, full, or prod
    goto :usage
)

REM Change to script directory
cd /d "%~dp0"

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Handle commands
if "%COMMAND%"=="up" goto :start_services
if "%COMMAND%"=="down" goto :stop_services
if "%COMMAND%"=="restart" goto :restart_services
if "%COMMAND%"=="build" goto :build_images
if "%COMMAND%"=="logs" goto :show_logs
if "%COMMAND%"=="status" goto :show_status
if "%COMMAND%"=="clean" goto :clean_up
if "%COMMAND%"=="help" goto :usage

echo Invalid command: %COMMAND%
goto :usage

:start_services
echo Starting EV91 Platform services...
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo Failed to start services. Check the logs for details.
    exit /b 1
)
echo Services started successfully!
goto :show_service_urls

:stop_services
echo Stopping EV91 Platform services...
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% down
echo Services stopped successfully!
goto :eof

:restart_services
echo Restarting EV91 Platform services...
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% restart
echo Services restarted successfully!
goto :eof

:build_images
echo Building Docker images...
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% build --no-cache
echo Images built successfully!
goto :eof

:show_logs
echo Showing service logs...
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% logs -f
goto :eof

:show_status
echo Service Status:
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% ps
goto :eof

:clean_up
echo Cleaning up Docker containers and images...
docker-compose --env-file %ENV_FILE% -f %COMPOSE_FILE% down -v --rmi all
docker system prune -f
echo Cleanup completed!
goto :eof

:show_service_urls
echo.
echo === EV91 Platform Service URLs ===
if "%ENVIRONMENT%"=="dev" (
    echo Admin Portal: http://localhost:3000
    echo API Gateway: http://localhost:4000
    echo Auth Service: http://localhost:4001
    echo PostgreSQL: localhost:5432
    echo Redis: localhost:6379
) else (
    echo Admin Portal: http://localhost:3000
    echo API Gateway: http://localhost:4000
    echo Auth Service: http://localhost:4001
    echo User Service: http://localhost:3001
    echo Team Service: http://localhost:3002
    echo Payment Service: http://localhost:4003
    echo Client Store Service: http://localhost:3004
    echo Vehicle Service: http://localhost:4004
    echo Order Service: http://localhost:3005
    echo Rider Service: http://localhost:6000
    echo Notification Service: http://localhost:3006
    echo Template Service: http://localhost:3007
    echo Mobile App ^(Expo^): http://localhost:19006
    echo PostgreSQL: localhost:5432
    echo Redis: localhost:6379
)
echo.
goto :eof

:usage
echo.
echo Usage: docker-manage.bat [environment] [command]
echo.
echo Environments:
echo   dev  - Essential services only ^(default^)
echo   full - All services
echo   prod - Production environment
echo.
echo Commands:
echo   up      - Start all services
echo   down    - Stop all services
echo   restart - Restart all services
echo   build   - Build all images
echo   logs    - Show logs
echo   status  - Show service status
echo   clean   - Clean up containers and images
echo   help    - Show this help
echo.
goto :eof
