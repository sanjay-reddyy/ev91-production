@echo off
echo Starting EV91 Auth Service...
echo.

echo 🔄 Running Prisma migration...
npm run migrate

echo.
echo 🌱 Seeding database...
npm run seed

echo.
echo 🚀 Starting development server...
npm run dev
