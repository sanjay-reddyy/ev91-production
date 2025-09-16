@echo off
echo Starting Docker Services with Updated Code...
echo.

echo 1. Stopping all containers...
docker-compose down

echo.
echo 2. Starting core infrastructure...
docker-compose up -d postgres redis

echo.
echo 3. Waiting for database to be ready...
timeout /t 15

echo.
echo 4. Starting vehicle service...
docker-compose up --build -d vehicle-service

echo.
echo 5. Waiting for vehicle service...
timeout /t 10

echo.
echo 6. Testing vehicle service...
echo Testing health endpoint:
curl -s http://localhost:4004/health || echo "Health check failed"

echo.
echo Testing OEMs API:
curl -s "http://localhost:4004/api/v1/oems?active=true" || echo "OEMs API failed"

echo.
echo.
echo ========================================
echo Vehicle Service Status:
echo ========================================
docker ps --filter "name=vehicle-service"

echo.
echo Vehicle Service Logs (last 10 lines):
docker logs infra-vehicle-service-1 --tail 10

echo.
echo ========================================
echo SUCCESS! Vehicle Service is now running on:
echo - Health: http://localhost:4004/health  
echo - OEMs API: http://localhost:4004/api/v1/oems
echo ========================================
