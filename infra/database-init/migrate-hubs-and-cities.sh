#!/bin/bash
# Hub and City Migration Script for Docker Environment
# This script ensures safe migration of existing data

echo "🔄 Starting Hub and City migration for EV91 Platform..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until pg_isready -h postgres -U postgres -d ev91db; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "✅ Database is ready!"

# Check if migration is needed
CITIES_EXIST=$(psql -h postgres -U postgres -d ev91db -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'vehicle' AND table_name = 'cities');")

if [ "$CITIES_EXIST" = "f" ]; then
    echo "🏗️  Cities table not found. Migration needed."
    
    # Apply Prisma migrations
    echo "📦 Applying Prisma migrations..."
    npx prisma migrate deploy
    
    # Apply seed data
    echo "🌱 Applying city and hub seed data..."
    psql -h postgres -U postgres -d ev91db -f /docker-entrypoint-initdb.d/02-cities-and-hubs-seed.sql
    
    echo "✅ Migration completed successfully!"
else
    echo "✅ Cities table already exists. No migration needed."
fi

echo "🎉 Hub and City migration process completed!"
