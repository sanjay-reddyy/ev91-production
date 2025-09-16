@echo off
echo 🌱 EV91 Auth Service - Complete Database Seed
echo =============================================

echo.
echo 📋 This script will:
echo - Clear all existing data
echo - Create cities, departments, roles, permissions
echo - Create default users with proper roles
echo - Set up employee hierarchy and teams
echo.

set /p confirm="⚠️  This will RESET the database. Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Aborted by user
    exit /b
)

echo.
echo 🔄 Running database migrations...
call npx prisma db push

echo.
echo 🌱 Starting database seeding...
node complete-seed.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Database seeded successfully!
    echo.
    echo 🔑 Test Login Credentials:
    echo Super Admin: superadmin@ev91.com / SuperAdmin123!
    echo Admin:       admin@ev91.com       / Password123!
    echo Manager:     manager@ev91.com     / Password123!
    echo Operator:    operator@ev91.com    / Password123!
    echo Telecaller:  telecaller@ev91.com  / Password123!
    echo Test User:   test@ev91.com        / Password123!
    echo.
) else (
    echo ❌ Seeding failed with error code %ERRORLEVEL%
)

pause
