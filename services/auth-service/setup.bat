@echo off
echo 🚀 Setting up EV91 Auth Service with RBAC...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the auth-service directory
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npx prisma generate

REM Check if .env exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy "src\.env.example" ".env"
    echo ⚠️  Please update the DATABASE_URL and JWT secrets in .env file
) else (
    echo ✅ .env file already exists
)

echo.
echo ✅ Setup completed!
echo.
echo 📋 Next steps:
echo 1. Update your .env file with correct database URL and secrets
echo 2. Run: npx prisma migrate dev --name init
echo 3. Run: npx ts-node prisma/seed.ts (to create initial RBAC data)
echo 4. Run: npm run dev (to start the service)
echo.
echo 📖 Documentation: http://localhost:4001/api/docs
echo ❤️  Health Check: http://localhost:4001/health
