#!/bin/bash

# EV91 Platform Database Export Script
# This script creates a complete database backup for developer handover

echo "🔄 Starting EV91 Platform Database Export..."

# Configuration
BACKUP_DIR="$(pwd)"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="ev91platform"
DB_USER="ev91user"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PostgreSQL is accessible
check_postgres() {
    log_info "Checking PostgreSQL connection..."

    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
        log_success "PostgreSQL is accessible"
        return 0
    else
        log_error "Cannot connect to PostgreSQL. Please ensure:"
        echo "  - PostgreSQL is running on ${DB_HOST}:${DB_PORT}"
        echo "  - Database ${DB_NAME} exists"
        echo "  - User ${DB_USER} has access"
        echo "  - PGPASSWORD environment variable is set"
        return 1
    fi
}

# Export complete database
export_complete_database() {
    log_info "Exporting complete database..."

    local output_file="ev91_complete_backup.sql"

    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --encoding=UTF8 \
        --no-owner \
        --no-privileges \
        $DB_NAME > "$output_file"

    if [ $? -eq 0 ]; then
        local file_size=$(du -h "$output_file" | cut -f1)
        log_success "Complete database exported: $output_file (${file_size})"

        # Add metadata header
        sed -i '1i-- EV91 Platform Complete Database Backup' "$output_file"
        sed -i "2i-- Created: $(date)" "$output_file"
        sed -i "3i-- Database: $DB_NAME" "$output_file"
        sed -i "4i-- " "$output_file"

        return 0
    else
        log_error "Failed to export complete database"
        return 1
    fi
}

# Export individual service schemas
export_service_schemas() {
    log_info "Exporting individual service schemas..."

    # Define service tables mapping
    declare -A service_tables=(
        ["auth-service"]="users roles permissions user_roles role_permissions sessions"
        ["team-service"]="teams departments team_members department_heads"
        ["vehicle-service"]="vehicles vehicle_models oems vehicle_assignments"
        ["client-store-service"]="clients stores client_contacts store_managers"
        ["rider-service"]="riders rider_profiles rider_assignments rider_documents"
        ["spare-parts-service"]="spare_parts categories suppliers inventory_transactions"
    )

    for service in "${!service_tables[@]}"; do
        log_info "Exporting ${service} schema..."

        local output_file="${service}-schema.sql"
        local tables="${service_tables[$service]}"

        # Create service-specific dump
        {
            echo "-- $service Schema Export"
            echo "-- Created: $(date)"
            echo "-- Tables: $tables"
            echo ""

            for table in $tables; do
                # Check if table exists
                local table_exists=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table' AND table_schema = 'public';" 2>/dev/null | tr -d ' ')

                if [ "$table_exists" = "1" ]; then
                    echo "-- Table: $table"
                    pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER \
                        --table=$table \
                        --data-only \
                        --column-inserts \
                        $DB_NAME 2>/dev/null
                    echo ""
                else
                    echo "-- Table $table not found, skipping..."
                fi
            done
        } > "$output_file"

        if [ -f "$output_file" ] && [ -s "$output_file" ]; then
            log_success "Exported $service schema: $output_file"
        else
            log_warning "No data found for $service or export failed"
        fi
    done
}

# Export seed data
export_seed_data() {
    log_info "Exporting seed data..."

    # Admin users and roles
    {
        echo "-- Admin Users and Roles Seed Data"
        echo "-- Created: $(date)"
        echo ""

        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 'INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (' ||
               '''' || id || ''', ''' || name || ''', ''' || COALESCE(description, '') || ''', ''' ||
               created_at || ''', ''' || updated_at || ''');'
        FROM roles;" 2>/dev/null | grep "INSERT INTO roles" || echo "-- No roles found"

        echo ""

        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 'INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES (' ||
               '''' || id || ''', ''' || email || ''', ''' || password || ''', ''' ||
               COALESCE(first_name, '') || ''', ''' || COALESCE(last_name, '') || ''', ''' ||
               role || ''', ''' || created_at || ''', ''' || updated_at || ''');'
        FROM users WHERE role = 'SUPER_ADMIN' OR role = 'ADMIN';" 2>/dev/null | grep "INSERT INTO users" || echo "-- No admin users found"

    } > "admin-users.sql"

    # System configurations
    {
        echo "-- System Configurations Seed Data"
        echo "-- Created: $(date)"
        echo ""
        echo "-- Add your system configurations here"
        echo "-- Example: default settings, application configurations, etc."
    } > "configurations.sql"

    # Sample data for development
    {
        echo "-- Sample Development Data"
        echo "-- Created: $(date)"
        echo ""
        echo "-- This file contains sample data for development and testing"
        echo "-- Import this after setting up the basic schema"
        echo ""
        echo "-- Sample departments"
        echo "INSERT INTO departments (name, description) VALUES"
        echo "  ('Engineering', 'Software and hardware development'),"
        echo "  ('Operations', 'Daily operations and logistics'),"
        echo "  ('Support', 'Customer support and maintenance')"
        echo "ON CONFLICT (name) DO NOTHING;"
        echo ""
        echo "-- Sample vehicle models"
        echo "INSERT INTO vehicle_models (name, type, manufacturer) VALUES"
        echo "  ('Model S', 'Electric Car', 'Tesla'),"
        echo "  ('Leaf', 'Electric Car', 'Nissan'),"
        echo "  ('i3', 'Electric Car', 'BMW')"
        echo "ON CONFLICT (name) DO NOTHING;"
    } > "sample-data.sql"

    log_success "Seed data files created"
}

# Generate database statistics
generate_statistics() {
    log_info "Generating database statistics..."

    {
        echo "# EV91 Platform Database Statistics"
        echo "Generated: $(date)"
        echo ""

        echo "## Database Overview"
        echo "- Database Name: $DB_NAME"
        echo "- Host: $DB_HOST:$DB_PORT"
        echo "- User: $DB_USER"
        echo ""

        echo "## Table Statistics"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT
            schemaname as schema,
            tablename as table_name,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC;" 2>/dev/null || echo "Could not generate table statistics"

        echo ""
        echo "## Index Statistics"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT
            schemaname as schema,
            tablename as table_name,
            indexname as index_name,
            idx_scan as index_scans,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC;" 2>/dev/null || echo "Could not generate index statistics"

        echo ""
        echo "## Database Size"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT
            pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;" 2>/dev/null || echo "Could not get database size"

    } > "database-statistics.md"

    log_success "Database statistics generated: database-statistics.md"
}

# Create verification script
create_verification_script() {
    log_info "Creating verification script..."

    cat > "verify-import.sh" << 'EOF'
#!/bin/bash

# EV91 Platform Database Import Verification Script

echo "🔍 Verifying EV91 Platform Database Import..."

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="ev91platform"
DB_USER="ev91user"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test functions
test_connection() {
    echo -n "Testing database connection... "
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

test_tables() {
    echo -n "Checking tables exist... "
    local table_count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

    if [ "$table_count" -gt 10 ]; then
        echo -e "${GREEN}✅ Found $table_count tables${NC}"
        return 0
    else
        echo -e "${RED}❌ Only found $table_count tables${NC}"
        return 1
    fi
}

test_admin_user() {
    echo -n "Checking admin user... "
    local admin_exists=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@ev91platform.com';" 2>/dev/null | tr -d ' ')

    if [ "$admin_exists" = "1" ]; then
        echo -e "${GREEN}✅ Admin user found${NC}"
        return 0
    else
        echo -e "${RED}❌ Admin user not found${NC}"
        return 1
    fi
}

test_foreign_keys() {
    echo -n "Checking foreign keys... "
    local fk_count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';" 2>/dev/null | tr -d ' ')

    if [ "$fk_count" -gt 0 ]; then
        echo -e "${GREEN}✅ Found $fk_count foreign keys${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  No foreign keys found${NC}"
        return 1
    fi
}

# Run tests
echo "Running verification tests..."
echo ""

test_connection || exit 1
test_tables || exit 1
test_admin_user || exit 1
test_foreign_keys

echo ""
echo -e "${GREEN}✅ Database verification completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the application services"
echo "2. Test login with admin@ev91platform.com / Admin123!"
echo "3. Verify all features work correctly"
EOF

    chmod +x "verify-import.sh"
    log_success "Verification script created: verify-import.sh"
}

# Main execution
main() {
    echo "🚀 EV91 Platform Database Export"
    echo "=================================="
    echo "Backup Directory: $BACKUP_DIR"
    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST:$DB_PORT"
    echo "User: $DB_USER"
    echo ""

    # Check if PGPASSWORD is set
    if [ -z "$PGPASSWORD" ]; then
        log_warning "PGPASSWORD environment variable not set"
        echo "Please set it before running this script:"
        echo "export PGPASSWORD='your-database-password'"
        echo ""
        read -s -p "Enter database password: " PGPASSWORD
        export PGPASSWORD
        echo ""
    fi

    # Run export steps
    check_postgres || exit 1
    echo ""

    export_complete_database || exit 1
    echo ""

    export_service_schemas
    echo ""

    export_seed_data
    echo ""

    generate_statistics
    echo ""

    create_verification_script
    echo ""

    log_success "🎉 Database export completed successfully!"
    echo ""
    echo "Files created:"
    ls -la *.sql *.md *.sh 2>/dev/null || echo "No files created"
    echo ""
    echo "To import the database:"
    echo "1. Start PostgreSQL"
    echo "2. Run: psql -h localhost -U ev91user -d ev91platform -f ev91_complete_backup.sql"
    echo "3. Run: ./verify-import.sh"
    echo ""
    echo "See README.md for detailed instructions."
}

# Execute main function
main "$@"
