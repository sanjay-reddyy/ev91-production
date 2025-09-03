# Database Backup Export for EV91 Platform

## Overview

This directory contains the complete database backup for the EV91 Platform, ready for developer handover.

## Backup Contents

### 1. Complete Database Backup

- **File**: `ev91_complete_backup.sql`
- **Type**: Full PostgreSQL database dump
- **Contains**: All schemas, tables, data, indexes, and constraints

### 2. Individual Service Schemas

- **auth-service-schema.sql**: Authentication and user management tables
- **team-service-schema.sql**: Teams and departments tables
- **vehicle-service-schema.sql**: Vehicle fleet management tables
- **client-store-schema.sql**: Client and store management tables
- **rider-service-schema.sql**: Rider management tables
- **spare-parts-schema.sql**: Spare parts inventory tables

### 3. Seed Data

- **admin-users.sql**: Default admin users and roles
- **sample-data.sql**: Sample data for testing and development
- **configurations.sql**: System configurations and settings

## Import Instructions

### Complete Database Restore

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Import complete backup
psql -h localhost -U ev91user -d ev91platform -f ev91_complete_backup.sql

# Verify import
psql -h localhost -U ev91user -d ev91platform -c "\dt"
```

### Individual Service Import

```bash
# Import specific service schema
psql -h localhost -U ev91user -d ev91platform -f auth-service-schema.sql
psql -h localhost -U ev91user -d ev91platform -f team-service-schema.sql
# ... continue for other services
```

## Database Information

### Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: ev91platform
- **User**: ev91user
- **Password**: Set in your .env file

### Default Admin Credentials

- **Email**: admin@ev91platform.com
- **Password**: Admin123!
- **Role**: SUPER_ADMIN

### Database Statistics

- **Tables**: 45+ tables across all services
- **Users**: 1 admin user (expandable)
- **Sample Data**: Minimal for development setup

## Backup Details

- **Created**: $(date)
- **PostgreSQL Version**: 15+
- **Backup Method**: pg_dump with complete schema and data
- **Size**: [Will be determined after export]
- **Encoding**: UTF-8

## Verification Checklist

After import, verify:

1. **Tables exist**:

   ```sql
   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. **Admin user exists**:

   ```sql
   SELECT email, role FROM users WHERE email = 'admin@ev91platform.com';
   ```

3. **Foreign keys intact**:

   ```sql
   SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';
   ```

4. **Indexes created**:
   ```sql
   SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
   ```

## Troubleshooting

### Import Errors

- Ensure PostgreSQL is running
- Check user permissions
- Verify database encoding (UTF-8)

### Connection Issues

- Check .env file configuration
- Verify PostgreSQL service status
- Test connection before import

### Data Issues

- Run verification queries above
- Check logs during import
- Restore from individual schemas if needed

## Next Steps

1. Import the database backup
2. Configure environment variables
3. Start all services
4. Verify system functionality
5. Review DEVELOPER_SETUP_GUIDE.md for complete setup

---

**Created**: $(date)
**Version**: 1.0
**Contact**: Development Team
