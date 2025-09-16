@echo off
echo ============================================
echo    EV91 Platform - Complete Setup Verification
echo ============================================
echo.

echo 1. Checking PostgreSQL Service Status...
sc query postgresql-x64-16 | findstr "STATE"

echo.
echo 2. Testing Database Connection...
SET PGPASSWORD=EV91SecurePass2025!
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U ev91user -d ev91platform -c "SELECT 'Database connection: OK' as status;"

echo.
echo 3. Verifying All Schemas and Tables...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U ev91user -d ev91platform -c "SELECT table_schema, COUNT(table_name) as table_count FROM information_schema.tables WHERE table_schema IN ('auth', 'team', 'client_store', 'rider', 'vehicle') GROUP BY table_schema ORDER BY table_schema;"

echo.
echo 4. Checking .env Files...
if exist "C:\voice_project\EV91-Platform\infra\.env" (echo ✓ infra/.env exists) else (echo ✗ infra/.env missing)
if exist "C:\voice_project\EV91-Platform\services\auth-service\.env" (echo ✓ auth-service/.env exists) else (echo ✗ auth-service/.env missing)
if exist "C:\voice_project\EV91-Platform\services\team-service\.env" (echo ✓ team-service/.env exists) else (echo ✗ team-service/.env missing)
if exist "C:\voice_project\EV91-Platform\services\client-store-service\.env" (echo ✓ client-store-service/.env exists) else (echo ✗ client-store-service/.env missing)
if exist "C:\voice_project\EV91-Platform\services\rider-service\.env" (echo ✓ rider-service/.env exists) else (echo ✗ rider-service/.env missing)
if exist "C:\voice_project\EV91-Platform\services\vehicle-service\.env" (echo ✓ vehicle-service/.env exists) else (echo ✗ vehicle-service/.env missing)

echo.
echo 5. Checking Batch Scripts...
if exist "C:\voice_project\EV91-Platform\infra\setup-all-services.bat" (echo ✓ setup-all-services.bat exists) else (echo ✗ setup-all-services.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-auth-service.bat" (echo ✓ start-auth-service.bat exists) else (echo ✗ start-auth-service.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-team-service.bat" (echo ✓ start-team-service.bat exists) else (echo ✗ start-team-service.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-client-store-service.bat" (echo ✓ start-client-store-service.bat exists) else (echo ✗ start-client-store-service.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-rider-service.bat" (echo ✓ start-rider-service.bat exists) else (echo ✗ start-rider-service.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-vehicle-service.bat" (echo ✓ start-vehicle-service.bat exists) else (echo ✗ start-vehicle-service.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-api-gateway.bat" (echo ✓ start-api-gateway.bat exists) else (echo ✗ start-api-gateway.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-admin-portal.bat" (echo ✓ start-admin-portal.bat exists) else (echo ✗ start-admin-portal.bat missing)
if exist "C:\voice_project\EV91-Platform\infra\start-all-services.bat" (echo ✓ start-all-services.bat exists) else (echo ✗ start-all-services.bat missing)

echo.
echo ============================================
echo    Setup Verification Complete!
echo ============================================
echo.
echo Next Steps:
echo 1. Run: infra\setup-all-services.bat (to install dependencies)
echo 2. Run: infra\start-all-services.bat (starts everything at once)
echo 3. Or run individual service scripts from infra folder:
echo    - infra\start-auth-service.bat
echo    - infra\start-team-service.bat  
echo    - infra\start-client-store-service.bat
echo    - infra\start-rider-service.bat
echo    - infra\start-vehicle-service.bat
echo    - infra\start-api-gateway.bat
echo    - infra\start-admin-portal.bat
echo 4. Or use VS Code tasks to start services
echo.
pause
