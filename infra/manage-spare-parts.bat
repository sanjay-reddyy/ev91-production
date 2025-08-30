@echo off
REM EV91 Platform - Spare Parts Service Management Script (Windows)
REM This script manages Docker operations for the spare-parts-service

setlocal enabledelayedexpansion

REM Configuration
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "COMPOSE_FILE=%SCRIPT_DIR%docker-compose.spare-parts.yml"
set "SERVICE_NAME=spare-parts-service"
set "ENV_FILE=%SCRIPT_DIR%.env"

REM Colors (Windows CMD doesn't support colors natively, but we'll use echo)
set "INFO_PREFIX=[INFO]"
set "SUCCESS_PREFIX=[SUCCESS]"
set "WARNING_PREFIX=[WARNING]"
set "ERROR_PREFIX=[ERROR]"

REM Helper functions
:log_info
echo %INFO_PREFIX% %~1
exit /b

:log_success
echo %SUCCESS_PREFIX% %~1
exit /b

:log_warning
echo %WARNING_PREFIX% %~1
exit /b

:log_error
echo %ERROR_PREFIX% %~1
exit /b

:check_docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Docker is not running. Please start Docker and try again."
    exit /b 1
)
exit /b

:check_docker_compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit /b 1
)
exit /b

:show_usage
echo EV91 Platform - Spare Parts Service Management
echo.
echo Usage: %~nx0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   start           Start the spare-parts-service and dependencies
echo   stop            Stop the spare-parts-service
echo   restart         Restart the spare-parts-service
echo   build           Build the spare-parts-service Docker image
echo   rebuild         Rebuild and restart the spare-parts-service
echo   status          Show status of all services
echo   logs            Show logs from spare-parts-service
echo   shell           Open shell in spare-parts-service container
echo   db-setup        Initialize the database
echo   db-migrate      Run database migrations
echo   db-seed         Seed the database with sample data
echo   health          Check health of spare-parts-service
echo   clean           Stop and remove all containers and volumes
echo   dev             Start in development mode with hot reload
echo   help            Show this help message
echo.
echo Examples:
echo   %~nx0 start        # Start spare-parts service
echo   %~nx0 logs         # Show logs
echo   %~nx0 db-setup     # Initialize database
exit /b

:start_services
call :log_info "Starting spare-parts-service and dependencies..."
call :check_docker
if %errorlevel% neq 0 exit /b 1
call :check_docker_compose
if %errorlevel% neq 0 exit /b 1

docker-compose -f "%COMPOSE_FILE%" up -d
if %errorlevel% neq 0 (
    call :log_error "Failed to start services"
    exit /b 1
)

call :log_success "Services started successfully!"
call :log_info "Spare Parts Service: http://localhost:4006"
call :log_info "API Gateway: http://localhost:8000"
call :log_info "Database: localhost:5432"
call :log_info "Redis: localhost:6379"
exit /b

:stop_services
call :log_info "Stopping spare-parts-service..."
docker-compose -f "%COMPOSE_FILE%" stop "%SERVICE_NAME%"
call :log_success "Spare-parts-service stopped!"
exit /b

:restart_services
call :log_info "Restarting spare-parts-service..."
docker-compose -f "%COMPOSE_FILE%" restart "%SERVICE_NAME%"
call :log_success "Spare-parts-service restarted!"
exit /b

:build_services
call :log_info "Building spare-parts-service Docker image..."
docker-compose -f "%COMPOSE_FILE%" build "%SERVICE_NAME%"
call :log_success "Build completed!"
exit /b

:rebuild_services
call :log_info "Rebuilding and restarting spare-parts-service..."
docker-compose -f "%COMPOSE_FILE%" build --no-cache "%SERVICE_NAME%"
docker-compose -f "%COMPOSE_FILE%" up -d "%SERVICE_NAME%"
call :log_success "Rebuild and restart completed!"
exit /b

:show_status
call :log_info "Service Status:"
docker-compose -f "%COMPOSE_FILE%" ps
exit /b

:show_logs
call :log_info "Showing logs for spare-parts-service..."
docker-compose -f "%COMPOSE_FILE%" logs "%SERVICE_NAME%"
exit /b

:open_shell
call :log_info "Opening shell in spare-parts-service container..."
docker-compose -f "%COMPOSE_FILE%" exec "%SERVICE_NAME%" /bin/sh
exit /b

:setup_database
call :log_info "Setting up database for spare-parts-service..."

REM Wait for database to be ready
call :log_info "Waiting for database to be ready..."
docker-compose -f "%COMPOSE_FILE%" exec postgres sh -c "until pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do sleep 1; done"

REM Run Prisma migrations
call :log_info "Running Prisma migrations..."
docker-compose -f "%COMPOSE_FILE%" exec "%SERVICE_NAME%" npm run prisma:migrate

REM Generate Prisma client
call :log_info "Generating Prisma client..."
docker-compose -f "%COMPOSE_FILE%" exec "%SERVICE_NAME%" npm run prisma:generate

call :log_success "Database setup completed!"
exit /b

:migrate_database
call :log_info "Running database migrations..."
docker-compose -f "%COMPOSE_FILE%" exec "%SERVICE_NAME%" npm run prisma:migrate
call :log_success "Migrations completed!"
exit /b

:seed_database
call :log_info "Seeding database with sample data..."
docker-compose -f "%COMPOSE_FILE%" exec "%SERVICE_NAME%" npm run db:seed
call :log_success "Database seeded successfully!"
exit /b

:health_check
call :log_info "Checking health of spare-parts-service..."

REM Use PowerShell to make HTTP request (more reliable on Windows)
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:4006/health' -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Host '[SUCCESS] Spare-parts-service is healthy!'; $response.Content } else { Write-Host '[ERROR] Spare-parts-service is not healthy'; exit 1 } } catch { Write-Host '[ERROR] Failed to connect to spare-parts-service'; exit 1 }"
exit /b

:clean_up
call :log_warning "This will stop and remove all containers and volumes. Are you sure? (y/N)"
set /p confirmation="Enter your choice: "
if /i "!confirmation!"=="y" (
    call :log_info "Cleaning up containers and volumes..."
    docker-compose -f "%COMPOSE_FILE%" down -v --remove-orphans
    docker system prune -f
    call :log_success "Cleanup completed!"
) else (
    call :log_info "Cleanup cancelled."
)
exit /b

:dev_mode
call :log_info "Starting in development mode..."
set NODE_ENV=development
docker-compose -f "%COMPOSE_FILE%" up -d
call :show_logs
exit /b

REM Main script logic
if "%~1"=="" (
    call :log_error "No command specified."
    call :show_usage
    exit /b 1
)

if "%~1"=="start" (
    call :start_services
) else if "%~1"=="stop" (
    call :stop_services
) else if "%~1"=="restart" (
    call :restart_services
) else if "%~1"=="build" (
    call :build_services
) else if "%~1"=="rebuild" (
    call :rebuild_services
) else if "%~1"=="status" (
    call :show_status
) else if "%~1"=="logs" (
    call :show_logs
) else if "%~1"=="shell" (
    call :open_shell
) else if "%~1"=="db-setup" (
    call :setup_database
) else if "%~1"=="db-migrate" (
    call :migrate_database
) else if "%~1"=="db-seed" (
    call :seed_database
) else if "%~1"=="health" (
    call :health_check
) else if "%~1"=="clean" (
    call :clean_up
) else if "%~1"=="dev" (
    call :dev_mode
) else if "%~1"=="help" (
    call :show_usage
) else (
    call :log_error "Unknown command: %~1"
    call :show_usage
    exit /b 1
)
