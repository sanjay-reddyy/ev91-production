@echo off
echo Starting EV91 Platform - Development Environment...
echo.

echo 1. Stopping all Docker containers...
docker-compose -f infra/docker-compose.dev.yml down

echo.
echo 2. Removing old volumes (if needed)...
docker-compose -f infra/docker-compose.dev.yml down -v

echo.
echo 3. Building and starting development services...
docker-compose -f infra/docker-compose.dev.yml up --build -d

echo.
echo 4. Waiting for services to start...
timeout /t 15

echo.
echo 5. Creating database schemas...
docker exec infra-postgres-1 psql -U ev91user -d ev91db -c "CREATE SCHEMA IF NOT EXISTS vehicle; CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS team;"

echo.
echo 6. Running database migrations for vehicle service...
timeout /t 5
docker exec infra-vehicle-service-1 npx prisma db push

echo.
echo 7. Checking service status...
docker-compose -f infra/docker-compose.dev.yml ps

echo.
echo 8. Testing services...
echo.
echo Testing API Gateway:
curl -s http://localhost:8000/health || echo "API Gateway not ready yet"

echo.
echo Testing Vehicle Service:
curl -s http://localhost:4003/health || echo "Vehicle Service not ready yet"

echo.
echo Testing Admin Portal:
curl -s http://localhost:3001 || echo "Admin Portal not ready yet"

echo.
echo.
echo ========================================
echo SUCCESS! EV91 Platform Development Environment
echo ========================================
echo.
echo Frontend Services:
echo - Admin Portal: http://localhost:3001
echo.
echo Backend Services:
echo - API Gateway: http://localhost:8000
echo - Vehicle Service: http://localhost:4003
echo - Auth Service: http://localhost:4001
echo - Team Service: http://localhost:3002
echo.
echo Database:
echo - PostgreSQL: localhost:5432
echo - Redis: localhost:6379
echo.
echo API Endpoints (through API Gateway):
echo - Vehicle OEMs: http://localhost:8000/api/v1/oems
echo - Health Check: http://localhost:8000/health
echo.
echo ========================================
echo.
echo If you see any issues, check logs with:
echo docker-compose -f infra/docker-compose.dev.yml logs [service-name]
