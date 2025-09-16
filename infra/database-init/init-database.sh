#!/bin/bash
set -e

echo "🗄️ Starting database initialization..."

# Create the user if it doesn't exist
echo "👤 Creating database user..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ev91user') THEN
            CREATE USER ev91user WITH PASSWORD 'ev91pass';
        END IF;
    END
    \$\$;
    
    -- Grant all privileges
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO ev91user;
    GRANT ALL PRIVILEGES ON SCHEMA public TO ev91user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ev91user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ev91user;
    
    -- Future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ev91user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ev91user;
EOSQL

echo "✅ Database user created and permissions granted"

# Always run the seed data script
echo "🌱 Seeding database with essential data..."
if [ -f /docker-entrypoint-initdb.d/01-seed-data.sql ]; then
    echo "📥 Running seed data script..."
    psql -v ON_ERROR_STOP=1 --username "ev91user" --dbname "$POSTGRES_DB" < /docker-entrypoint-initdb.d/01-seed-data.sql
    echo "✅ Database seeded successfully!"
else
    echo "⚠️ Seed data file not found, skipping..."
fi

# Check if backup file exists and restore if needed
if [ -f /docker-entrypoint-initdb.d/backup/ev91_backup.sql ]; then
    echo "� Found backup file, importing existing data..."
    psql -v ON_ERROR_STOP=1 --username "ev91user" --dbname "$POSTGRES_DB" < /docker-entrypoint-initdb.d/backup/ev91_backup.sql
    echo "✅ Database backup restored successfully!"
fi

echo "📊 Database Statistics:"
psql -v ON_ERROR_STOP=1 --username "ev91user" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'OEMs' as table_name, COUNT(*) as count FROM oems
    UNION ALL
    SELECT 'Vehicle Models', COUNT(*) FROM vehicle_models
    UNION ALL  
    SELECT 'Vehicles', COUNT(*) FROM vehicles;
EOSQL

echo "🎉 Database initialization completed!"
    
    -- Create extensions if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

echo "✅ Database initialization completed!"
