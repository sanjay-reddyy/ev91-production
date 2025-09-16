@echo off
echo Testing different password approaches...
echo.

echo 1. Trying with the set password...
SET PGPASSWORD=EV91SecurePass2025!
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT 'Connection successful!' as status;"

echo.
echo 2. If that failed, let's try connecting to reset the password manually...
echo.
echo Please try running this command manually:
echo "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
echo.
echo Then run: ALTER USER postgres PASSWORD 'EV91SecurePass2025!';
echo.
pause
