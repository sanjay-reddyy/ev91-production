# EV91 Platform Database Export Script (PowerShell)
# This script creates a complete database backup for developer handover

param(
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432",
    [string]$DBName = "ev91platform",
    [string]$DBUser = "ev91user",
    [string]$DBPassword = ""
)

# Configuration
$BackupDir = Get-Location
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Colors for output (Windows PowerShell compatible)
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Check if PostgreSQL tools are available
function Test-PostgreSQLTools {
    Write-Info "Checking PostgreSQL tools..."

    try {
        $null = Get-Command pg_dump -ErrorAction Stop
        $null = Get-Command psql -ErrorAction Stop
        Write-Success "PostgreSQL tools found"
        return $true
    }
    catch {
        Write-Error "PostgreSQL tools not found. Please install PostgreSQL client tools."
        Write-Host "Download from: https://www.postgresql.org/download/"
        return $false
    }
}

# Check PostgreSQL connection
function Test-PostgreSQLConnection {
    Write-Info "Testing PostgreSQL connection..."

    # Set password environment variable
    if ($DBPassword) {
        $env:PGPASSWORD = $DBPassword
    }

    try {
        $result = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PostgreSQL connection successful"
            return $true
        }
        else {
            Write-Error "Cannot connect to PostgreSQL"
            Write-Host "Error: $result"
            return $false
        }
    }
    catch {
        Write-Error "Failed to test PostgreSQL connection: $_"
        return $false
    }
}

# Export complete database
function Export-CompleteDatabase {
    Write-Info "Exporting complete database..."

    $outputFile = "ev91_complete_backup.sql"

    try {
        # Run pg_dump
        $dumpArgs = @(
            "-h", $DBHost,
            "-p", $DBPort,
            "-U", $DBUser,
            "--verbose",
            "--clean",
            "--if-exists",
            "--create",
            "--format=plain",
            "--encoding=UTF8",
            "--no-owner",
            "--no-privileges",
            $DBName
        )

        & pg_dump @dumpArgs | Out-File -FilePath $outputFile -Encoding UTF8

        if ($LASTEXITCODE -eq 0 -and (Test-Path $outputFile)) {
            $fileSize = [math]::Round((Get-Item $outputFile).Length / 1MB, 2)
            Write-Success "Complete database exported: $outputFile ($fileSize MB)"

            # Add metadata header
            $content = Get-Content $outputFile
            $header = @(
                "-- EV91 Platform Complete Database Backup",
                "-- Created: $(Get-Date)",
                "-- Database: $DBName",
                "-- "
            )
            $header + $content | Set-Content $outputFile

            return $true
        }
        else {
            Write-Error "Failed to export complete database"
            return $false
        }
    }
    catch {
        Write-Error "Error during database export: $_"
        return $false
    }
}

# Export individual service schemas
function Export-ServiceSchemas {
    Write-Info "Exporting individual service schemas..."

    # Define service tables mapping
    $serviceTables = @{
        "auth-service" = @("users", "roles", "permissions", "user_roles", "role_permissions", "sessions")
        "team-service" = @("teams", "departments", "team_members", "department_heads")
        "vehicle-service" = @("vehicles", "vehicle_models", "oems", "vehicle_assignments")
        "client-store-service" = @("clients", "stores", "client_contacts", "store_managers")
        "rider-service" = @("riders", "rider_profiles", "rider_assignments", "rider_documents")
        "spare-parts-service" = @("spare_parts", "categories", "suppliers", "inventory_transactions")
    }

    foreach ($service in $serviceTables.Keys) {
        Write-Info "Exporting $service schema..."

        $outputFile = "$service-schema.sql"
        $tables = $serviceTables[$service]

        # Create service-specific dump
        $content = @(
            "-- $service Schema Export",
            "-- Created: $(Get-Date)",
            "-- Tables: $($tables -join ', ')",
            ""
        )

        foreach ($table in $tables) {
            # Check if table exists
            $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table' AND table_schema = 'public';"
            try {
                $tableExists = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -t -c $tableExistsQuery 2>$null
                $tableExists = $tableExists.Trim()

                if ($tableExists -eq "1") {
                    $content += "-- Table: $table"
                    $tableData = & pg_dump -h $DBHost -p $DBPort -U $DBUser --table=$table --data-only --column-inserts $DBName 2>$null
                    $content += $tableData
                    $content += ""
                }
                else {
                    $content += "-- Table $table not found, skipping..."
                }
            }
            catch {
                $content += "-- Error exporting table $table: $_"
            }
        }

        $content | Out-File -FilePath $outputFile -Encoding UTF8

        if (Test-Path $outputFile) {
            Write-Success "Exported $service schema: $outputFile"
        }
        else {
            Write-Warning "Failed to export $service schema"
        }
    }
}

# Export seed data
function Export-SeedData {
    Write-Info "Exporting seed data..."

    # Admin users and roles
    $adminContent = @(
        "-- Admin Users and Roles Seed Data",
        "-- Created: $(Get-Date)",
        ""
    )

    try {
        # Export roles
        $rolesQuery = "SELECT 'INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (' || '''' || id || ''', ''' || name || ''', ''' || COALESCE(description, '') || ''', ''' || created_at || ''', ''' || updated_at || ''');' FROM roles;"
        $roles = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c $rolesQuery 2>$null | Where-Object { $_ -like "*INSERT INTO roles*" }
        if ($roles) {
            $adminContent += $roles
        }
        else {
            $adminContent += "-- No roles found"
        }

        $adminContent += ""

        # Export admin users
        $usersQuery = "SELECT 'INSERT INTO users (id, email, password, first_name, last_name, role, created_at, updated_at) VALUES (' || '''' || id || ''', ''' || email || ''', ''' || password || ''', ''' || COALESCE(first_name, '') || ''', ''' || COALESCE(last_name, '') || ''', ''' || role || ''', ''' || created_at || ''', ''' || updated_at || ''');' FROM users WHERE role = 'SUPER_ADMIN' OR role = 'ADMIN';"
        $users = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c $usersQuery 2>$null | Where-Object { $_ -like "*INSERT INTO users*" }
        if ($users) {
            $adminContent += $users
        }
        else {
            $adminContent += "-- No admin users found"
        }
    }
    catch {
        $adminContent += "-- Error exporting admin data: $_"
    }

    $adminContent | Out-File -FilePath "admin-users.sql" -Encoding UTF8

    # System configurations
    $configContent = @(
        "-- System Configurations Seed Data",
        "-- Created: $(Get-Date)",
        "",
        "-- Add your system configurations here",
        "-- Example: default settings, application configurations, etc."
    )
    $configContent | Out-File -FilePath "configurations.sql" -Encoding UTF8

    # Sample data for development
    $sampleContent = @(
        "-- Sample Development Data",
        "-- Created: $(Get-Date)",
        "",
        "-- This file contains sample data for development and testing",
        "-- Import this after setting up the basic schema",
        "",
        "-- Sample departments",
        "INSERT INTO departments (name, description) VALUES",
        "  ('Engineering', 'Software and hardware development'),",
        "  ('Operations', 'Daily operations and logistics'),",
        "  ('Support', 'Customer support and maintenance')",
        "ON CONFLICT (name) DO NOTHING;",
        "",
        "-- Sample vehicle models",
        "INSERT INTO vehicle_models (name, type, manufacturer) VALUES",
        "  ('Model S', 'Electric Car', 'Tesla'),",
        "  ('Leaf', 'Electric Car', 'Nissan'),",
        "  ('i3', 'Electric Car', 'BMW')",
        "ON CONFLICT (name) DO NOTHING;"
    )
    $sampleContent | Out-File -FilePath "sample-data.sql" -Encoding UTF8

    Write-Success "Seed data files created"
}

# Generate database statistics
function New-DatabaseStatistics {
    Write-Info "Generating database statistics..."

    $statsContent = @(
        "# EV91 Platform Database Statistics",
        "Generated: $(Get-Date)",
        "",
        "## Database Overview",
        "- Database Name: $DBName",
        "- Host: $DBHost`:$DBPort",
        "- User: $DBUser",
        ""
    )

    try {
        $statsContent += "## Table Statistics"
        $tableStatsQuery = @"
SELECT
    schemaname as schema,
    tablename as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"@
        $tableStats = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c $tableStatsQuery 2>$null
        if ($tableStats) {
            $statsContent += $tableStats
        }
        else {
            $statsContent += "Could not generate table statistics"
        }

        $statsContent += ""
        $statsContent += "## Database Size"
        $sizeQuery = "SELECT pg_size_pretty(pg_database_size('$DBName')) as database_size;"
        $dbSize = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c $sizeQuery 2>$null
        if ($dbSize) {
            $statsContent += $dbSize
        }
        else {
            $statsContent += "Could not get database size"
        }
    }
    catch {
        $statsContent += "Error generating statistics: $_"
    }

    $statsContent | Out-File -FilePath "database-statistics.md" -Encoding UTF8
    Write-Success "Database statistics generated: database-statistics.md"
}

# Create verification script
function New-VerificationScript {
    Write-Info "Creating verification script..."

    $verifyContent = @'
# EV91 Platform Database Import Verification Script (PowerShell)

param(
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432",
    [string]$DBName = "ev91platform",
    [string]$DBUser = "ev91user"
)

Write-Host "🔍 Verifying EV91 Platform Database Import..." -ForegroundColor Blue

function Test-DatabaseConnection {
    Write-Host -NoNewline "Testing database connection... "
    try {
        $null = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c "SELECT 1;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Connected" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Failed" -ForegroundColor Red
        return $false
    }
}

function Test-DatabaseTables {
    Write-Host -NoNewline "Checking tables exist... "
    try {
        $tableCount = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
        $tableCount = $tableCount.Trim()

        if ([int]$tableCount -gt 10) {
            Write-Host "✅ Found $tableCount tables" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Only found $tableCount tables" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking tables" -ForegroundColor Red
        return $false
    }
}

function Test-AdminUser {
    Write-Host -NoNewline "Checking admin user... "
    try {
        $adminExists = & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@ev91platform.com';" 2>$null
        $adminExists = $adminExists.Trim()

        if ($adminExists -eq "1") {
            Write-Host "✅ Admin user found" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Admin user not found" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking admin user" -ForegroundColor Red
        return $false
    }
}

# Run tests
Write-Host "Running verification tests..." -ForegroundColor Blue
Write-Host ""

if (-not (Test-DatabaseConnection)) { exit 1 }
if (-not (Test-DatabaseTables)) { exit 1 }
if (-not (Test-AdminUser)) { exit 1 }

Write-Host ""
Write-Host "✅ Database verification completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Start the application services"
Write-Host "2. Test login with admin@ev91platform.com / Admin123!"
Write-Host "3. Verify all features work correctly"
'@

    $verifyContent | Out-File -FilePath "verify-import.ps1" -Encoding UTF8
    Write-Success "Verification script created: verify-import.ps1"
}

# Main execution
function Main {
    Write-Host "🚀 EV91 Platform Database Export" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "Backup Directory: $BackupDir"
    Write-Host "Database: $DBName"
    Write-Host "Host: $DBHost`:$DBPort"
    Write-Host "User: $DBUser"
    Write-Host ""

    # Check for password
    if (-not $DBPassword) {
        $securePassword = Read-Host "Enter database password" -AsSecureString
        $DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
        $env:PGPASSWORD = $DBPassword
    }
    else {
        $env:PGPASSWORD = $DBPassword
    }

    # Check PostgreSQL tools
    if (-not (Test-PostgreSQLTools)) {
        return
    }

    # Test connection
    if (-not (Test-PostgreSQLConnection)) {
        Write-Error "Cannot proceed without database connection"
        return
    }

    Write-Host ""

    # Run export steps
    if (-not (Export-CompleteDatabase)) {
        Write-Error "Failed to export complete database"
        return
    }

    Write-Host ""
    Export-ServiceSchemas

    Write-Host ""
    Export-SeedData

    Write-Host ""
    New-DatabaseStatistics

    Write-Host ""
    New-VerificationScript

    Write-Host ""
    Write-Success "🎉 Database export completed successfully!"
    Write-Host ""
    Write-Host "Files created:"
    Get-ChildItem -Filter "*.sql" | Format-Table Name, Length, LastWriteTime
    Get-ChildItem -Filter "*.md" | Format-Table Name, Length, LastWriteTime
    Get-ChildItem -Filter "*.ps1" | Format-Table Name, Length, LastWriteTime
    Write-Host ""
    Write-Host "To import the database:"
    Write-Host "1. Start PostgreSQL"
    Write-Host "2. Run: psql -h localhost -U ev91user -d ev91platform -f ev91_complete_backup.sql"
    Write-Host "3. Run: .\verify-import.ps1"
    Write-Host ""
    Write-Host "See README.md for detailed instructions."
}

# Execute main function
Main
