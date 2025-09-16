@echo off
echo ============================================
echo    EV91 Platform - Prisma Studio Launcher
echo ============================================
echo.

echo This will open Prisma Studio for all services to view database data graphically.
echo Each service will open in a separate browser tab/window.
echo.

echo Services that will be opened:
echo 1. Auth Service (Users, Sessions, Team Members)
echo 2. Team Service (Departments, Teams, Clients, Stores)
echo 3. Rider Service (Riders, OTP Verifications)
echo 4. Vehicle Service (OEMs, Models, Cities, Hubs, Vehicles)
echo 5. Client Store Service (Enhanced Clients, Stores, Earnings)
echo.

pause

echo ============================================
echo 1. Starting Prisma Studio for Auth Service
echo ============================================
echo Opening Auth Service Prisma Studio (port 5555)...
start cmd /k "cd /d C:\voice_project\EV91-Platform\services\auth-service && echo Starting Auth Service Prisma Studio... && npx prisma studio --port 5555"

echo Waiting 3 seconds before next service...
timeout /t 3 /nobreak > nul

echo ============================================
echo 2. Starting Prisma Studio for Team Service
echo ============================================
echo Opening Team Service Prisma Studio (port 5556)...
start cmd /k "cd /d C:\voice_project\EV91-Platform\services\team-service && echo Starting Team Service Prisma Studio... && npx prisma studio --port 5556"

echo Waiting 3 seconds before next service...
timeout /t 3 /nobreak > nul

echo ============================================
echo 3. Starting Prisma Studio for Rider Service
echo ============================================
echo Opening Rider Service Prisma Studio (port 5557)...
start cmd /k "cd /d C:\voice_project\EV91-Platform\services\rider-service && echo Starting Rider Service Prisma Studio... && npx prisma studio --port 5557"

echo Waiting 3 seconds before next service...
timeout /t 3 /nobreak > nul

echo ============================================
echo 4. Starting Prisma Studio for Vehicle Service
echo ============================================
echo Opening Vehicle Service Prisma Studio (port 5558)...
start cmd /k "cd /d C:\voice_project\EV91-Platform\services\vehicle-service && echo Starting Vehicle Service Prisma Studio... && npx prisma studio --port 5558"

echo Waiting 3 seconds before next service...
timeout /t 3 /nobreak > nul

echo ============================================
echo 5. Starting Prisma Studio for Client Store Service
echo ============================================
echo Opening Client Store Service Prisma Studio (port 5559)...
start cmd /k "cd /d C:\voice_project\EV91-Platform\services\client-store-service && echo Starting Client Store Service Prisma Studio... && npx prisma studio --port 5559"

echo.
echo ============================================
echo    All Prisma Studios Started!
echo ============================================
echo.
echo Prisma Studio URLs (will open automatically):
echo.
echo 🔐 Auth Service:         http://localhost:5555
echo 👥 Team Service:         http://localhost:5556
echo 🚴 Rider Service:        http://localhost:5557
echo 🚗 Vehicle Service:      http://localhost:5558
echo 🏪 Client Store Service: http://localhost:5559
echo.
echo 💡 Tips:
echo - Each service opens in its own terminal window
echo - Close terminal windows to stop Prisma Studio for that service
echo - Data changes are reflected in real-time
echo - You can edit data directly in Prisma Studio
echo.

echo Waiting 5 seconds before opening browsers...
timeout /t 5 /nobreak > nul

echo Opening browser tabs...
start http://localhost:5555
timeout /t 1 /nobreak > nul
start http://localhost:5556
timeout /t 1 /nobreak > nul
start http://localhost:5557
timeout /t 1 /nobreak > nul
start http://localhost:5558
timeout /t 1 /nobreak > nul
start http://localhost:5559

echo.
echo ✅ All Prisma Studios are now running!
echo.
echo To stop all studios, close this window or press Ctrl+C
echo.
pause
