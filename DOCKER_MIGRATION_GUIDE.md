# 🗄️ EV91 Platform - Database Migration & Docker Setup

## 📋 Overview

This guide will help you:
1. Export your existing database data
2. Set up Docker containers with your existing data
3. Start all services with preserved data

## 🚀 Quick Start

### Step 1: Export Your Existing Database

**Option A: Using the automated script (Recommended)**
```bash
cd infra
./export-database.bat    # Windows
./export-database.sh     # Linux/Mac
```

**Option B: Manual export**
```bash
# Replace with your actual database details
pg_dump -h localhost -p 5432 -U your_username -d your_database_name --no-owner --no-privileges --clean --if-exists > infra/database-backup/ev91_backup.sql
```

### Step 2: Verify Export
```bash
# Check the backup file exists and has content
dir infra\database-backup\ev91_backup.sql     # Windows
ls -la infra/database-backup/ev91_backup.sql  # Linux/Mac
```

### Step 3: Start Docker Services
```bash
cd infra

# Start essential services (recommended for development)
./docker-manage.bat dev up

# OR start all services
./docker-manage.bat full up
```

## 🔧 What Happens During Startup

1. **PostgreSQL Container**: 
   - Creates fresh database with your credentials
   - Automatically imports your backup data from `ev91_backup.sql`
   - Sets up extensions and permissions

2. **All Services**:
   - Connect to the restored database
   - Use your existing data
   - No data loss!

## 📊 Service URLs After Startup

### Essential Services (dev)
- **Admin Portal**: http://localhost:3000
- **API Gateway**: http://localhost:8000  
- **Auth Service**: http://localhost:4001
- **Database**: localhost:5432

### All Services (full)
- **Auth Service**: http://localhost:4001
- **User Service**: http://localhost:3001
- **Team Service**: http://localhost:3002
- **Vehicle Service**: http://localhost:4004
- **Rider Service**: http://localhost:6000
- **Order Service**: http://localhost:3005
- **Payment Service**: http://localhost:4003
- **Notification Service**: http://localhost:3006
- **Client Store Service**: http://localhost:3004
- **Template Service**: http://localhost:3007

## 🔍 Verification Steps

### 1. Check Database Import
```bash
# Connect to the database
docker exec -it infra-postgres-1 psql -U ev91user -d ev91db

# List tables to verify your data
\dt

# Check record counts
SELECT 'users' as table_name, count(*) from users
UNION ALL
SELECT 'teams', count(*) from teams
UNION ALL  
SELECT 'vehicles', count(*) from vehicles;

# Exit
\q
```

### 2. Test Service Health
```bash
# Check all services are running
./docker-manage.bat dev status

# Test service endpoints
curl http://localhost:4001/health  # Auth service
curl http://localhost:8000/health  # API Gateway
curl http://localhost:3002/health  # Team service
```

### 3. Test Admin Portal Login
1. Open http://localhost:3000
2. Try logging in with your existing credentials
3. Verify you can see your existing data

## 🛠️ Troubleshooting

### Database Import Issues

**Problem**: "Database import failed"
```bash
# Check PostgreSQL logs
docker logs infra-postgres-1

# Verify backup file
head -n 20 infra/database-backup/ev91_backup.sql
```

**Solution**: 
- Ensure backup file has content
- Check PostgreSQL version compatibility
- Verify credentials in `.env.dev`

### Service Connection Issues

**Problem**: "Service can't connect to database"
```bash
# Check database is healthy
docker ps | grep postgres

# Test database connection
docker exec -it infra-postgres-1 pg_isready -U ev91user -d ev91db
```

**Solution**:
- Wait for database health check to pass
- Verify environment variables
- Check service logs: `docker logs infra-auth-service-1`

### Port Conflicts

**Problem**: "Port already in use"
```bash
# Check what's using the port
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <process_id> /F
```

## 🔄 Alternative: External Database Connection

If you prefer to keep your existing database running separately:

### 1. Update Environment Variables
```bash
# Edit infra/.env.dev
DATABASE_URL=postgresql://username:password@your-host:5432/your-database
```

### 2. Start Services Without PostgreSQL
```bash
# Edit docker-compose.dev.yml to comment out postgres service
# Then start other services
docker-compose --env-file .env.dev -f docker-compose.dev.yml up auth-service api-gateway admin-portal redis
```

## 📈 Performance Tips

1. **Use Development Environment**: Start only essential services
2. **Allocate Resources**: Increase Docker Desktop memory to 8GB+
3. **Monitor Logs**: Use `docker logs` to track service startup
4. **Health Checks**: Wait for services to be healthy before testing

## 🔒 Security Notes

- Default development credentials are in `.env.dev`
- Change passwords for production use
- Database is only accessible from Docker network
- Use `.env.prod` for production deployment

## 📞 Support

If you encounter issues:
1. Check the logs: `./docker-manage.bat dev logs`
2. Verify database backup has content
3. Ensure Docker has enough resources allocated
4. Test database connectivity first, then services

Your existing data will be preserved and available in the Docker environment! 🎉
