# Database Migration Guide - SQLite to PostgreSQL

This guide helps you migrate your existing test data from SQLite to the new Docker PostgreSQL setup while preserving all your test data.

## Overview

Your current setup uses SQLite with the database file located at:
```
services/auth-service/prisma/dev.db
```

The new Docker setup uses PostgreSQL for better production readiness and consistency across environments.

## Migration Process

### Prerequisites

1. **Docker Desktop** must be running
2. **Node.js** must be installed
3. Your existing SQLite database with test data must be present

### Step 1: Run the Migration

We've created automated scripts to handle the migration:

#### Option A: PowerShell (Recommended)
```powershell
cd infra
.\migrate-data.ps1
```

#### Option B: Batch File
```cmd
cd infra
migrate-data.bat
```

#### Option C: Manual Migration
```bash
cd infra
npm install sqlite3 pg
node migrate-sqlite-to-postgres.js
```

### Step 2: What the Migration Does

1. **Starts PostgreSQL** - Launches the PostgreSQL container
2. **Creates Tables** - Sets up the same schema structure in PostgreSQL
3. **Migrates Data** - Transfers all your test data from SQLite to PostgreSQL
4. **Preserves Relationships** - Maintains all foreign key relationships and constraints
5. **Updates Configuration** - Optionally updates your auth-service .env file

### Step 3: Verify Migration

After migration, you can verify your data by:

```bash
# Connect to PostgreSQL container
docker exec -it ev91-postgres-dev psql -U ev91user -d ev91_dev

# Check tables and data
\dt                    # List tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM permissions;
\q                     # Exit
```

### Step 4: Update Auth Service Configuration

The migration script can automatically update your auth-service .env file, or you can do it manually:

**Before (SQLite):**
```env
DATABASE_URL="file:./dev.db"
```

**After (PostgreSQL):**
```env
DATABASE_URL="postgresql://ev91user:ev91dev_password@localhost:5432/ev91_dev"
```

### Step 5: Start All Services

After successful migration, start all services:

```bash
cd infra
.\start-platform.bat
```

## Troubleshooting

### PostgreSQL Not Starting
```bash
docker logs ev91-postgres-dev
docker-compose -f docker-compose.dev.yml restart postgres
```

### Migration Script Errors
1. Ensure SQLite database exists at the correct path
2. Check Docker is running
3. Verify PostgreSQL container is healthy
4. Check network connectivity

### Data Verification Issues
```bash
# Compare record counts
# SQLite
sqlite3 ../services/auth-service/prisma/dev.db "SELECT COUNT(*) FROM users;"

# PostgreSQL  
docker exec ev91-postgres-dev psql -U ev91user -d ev91_dev -c "SELECT COUNT(*) FROM users;"
```

## Files Created/Modified

- `infra/migrate-sqlite-to-postgres.js` - Main migration script
- `infra/migrate-data.ps1` - PowerShell migration wrapper
- `infra/migrate-data.bat` - Batch migration wrapper
- `infra/package.json` - Dependencies for migration
- `services/auth-service/prisma/schema.postgresql.prisma` - PostgreSQL schema
- `services/auth-service/.env` - Updated database URL (if chosen)

## Backup Information

- Your original SQLite database remains untouched
- A backup of your original .env file is created as `.env.backup`
- You can always revert back if needed

## Next Steps

After successful migration:

1. **Test Authentication** - Verify login with your existing test users
2. **Test Authorization** - Check role-based access control
3. **Run Tests** - Execute your test suites to ensure everything works
4. **Monitor Logs** - Check service logs for any issues

## Support

If you encounter any issues during migration:

1. Check the migration logs for specific error messages
2. Verify Docker container health: `docker ps`
3. Check PostgreSQL logs: `docker logs ev91-postgres-dev`
4. Ensure all required environment variables are set

The migration preserves:
- ✅ All user accounts and passwords
- ✅ All roles and permissions
- ✅ All user-role assignments
- ✅ All role-permission mappings
- ✅ All timestamps and audit trails
- ✅ All data relationships and constraints
