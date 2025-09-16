#!/bin/bash
set -e

# Function to create database if it doesn't exist
create_database() {
    local database_name=$1
    echo "Creating database: $database_name"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database_name') THEN
                CREATE DATABASE $database_name OWNER $POSTGRES_USER;
                GRANT ALL PRIVILEGES ON DATABASE $database_name TO $POSTGRES_USER;
            ELSE
                RAISE NOTICE 'Database $database_name already exists';
            END IF;
        END
        \$\$;
EOSQL
}

# Function to create schema if it doesn't exist
create_schema() {
    local database_name=$1
    local schema_name=$2
    echo "Creating schema $schema_name in database $database_name"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$database_name" <<-EOSQL
        CREATE SCHEMA IF NOT EXISTS $schema_name;
        GRANT ALL ON SCHEMA $schema_name TO $POSTGRES_USER;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA $schema_name TO $POSTGRES_USER;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA $schema_name TO $POSTGRES_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA $schema_name GRANT ALL ON TABLES TO $POSTGRES_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA $schema_name GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL
}

echo "Starting database initialization for EV91 Platform..."

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -U "$POSTGRES_USER"; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 2
done

echo "PostgreSQL is ready. Creating databases and schemas..."

# Create main platform database if it doesn't exist
echo "Ensuring main database exists: $POSTGRES_DB"

# Create schemas in the main database
echo "Creating schemas in database: $POSTGRES_DB"
create_schema "$POSTGRES_DB" "auth"
create_schema "$POSTGRES_DB" "teams"
create_schema "$POSTGRES_DB" "vehicles"
create_schema "$POSTGRES_DB" "clients"
create_schema "$POSTGRES_DB" "riders"
create_schema "$POSTGRES_DB" "spare_parts"
create_schema "$POSTGRES_DB" "api_gateway"

# Set search path for default schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Set default search path
    ALTER DATABASE $POSTGRES_DB SET search_path TO spare_parts, auth, teams, vehicles, clients, riders, api_gateway, public;
    
    -- Create extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Create user roles if they don't exist
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ev91_readonly') THEN
            CREATE ROLE ev91_readonly WITH LOGIN PASSWORD 'readonly_pass_2025';
            GRANT CONNECT ON DATABASE $POSTGRES_DB TO ev91_readonly;
            GRANT USAGE ON SCHEMA spare_parts, auth, teams, vehicles, clients, riders TO ev91_readonly;
            GRANT SELECT ON ALL TABLES IN SCHEMA spare_parts, auth, teams, vehicles, clients, riders TO ev91_readonly;
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ev91_app') THEN
            CREATE ROLE ev91_app WITH LOGIN PASSWORD 'app_pass_2025';
            GRANT CONNECT ON DATABASE $POSTGRES_DB TO ev91_app;
            GRANT USAGE ON SCHEMA spare_parts, auth, teams, vehicles, clients, riders TO ev91_app;
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA spare_parts, auth, teams, vehicles, clients, riders TO ev91_app;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA spare_parts, auth, teams, vehicles, clients, riders TO ev91_app;
        END IF;
    END
    \$\$;
EOSQL

echo "Database initialization completed successfully!"
echo "Created schemas: auth, teams, vehicles, clients, riders, spare_parts, api_gateway"
echo "Database: $POSTGRES_DB is ready for EV91 Platform services"
