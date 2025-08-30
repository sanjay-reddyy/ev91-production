# 🚀 Start EV91 Platform with Existing Database

## Step-by-Step Instructions

### 1. Export Your Current Database (First Time Only)

**Choose your preferred method:**

#### Option A: Windows Batch Script
```cmd
cd infra
export-database.bat
```

#### Option B: PowerShell Script  
```powershell
cd infra
.\export-database.ps1
```

#### Option C: Manual Command
```bash
# Replace with your actual database connection details
pg_dump -h your-host -p 5432 -U your-username -d your-database-name --no-owner --no-privileges --clean --if-exists > infra/database-backup/ev91_backup.sql
```

### 2. Verify Your Backup
```bash
# Check the file exists and has content
dir infra\database-backup\ev91_backup.sql    # Should show file size > 0

# Optional: Preview first few lines
type infra\database-backup\ev91_backup.sql | more
```

### 3. Start Docker Services

#### Option A: Essential Services Only (Recommended for Development)
```bash
cd infra
.\docker-manage.bat dev up
```
**Services Started:**
- PostgreSQL (with your data)
- Redis
- API Gateway
- Auth Service  
- Admin Portal

#### Option B: All Services (Full Environment)
```bash
cd infra
.\docker-manage.bat full up
```
**Services Started:** All 14 microservices + database + frontend

### 4. Monitor Startup Process

**Watch the logs to see database import:**
```bash
# Watch all services
.\docker-manage.bat dev logs

# Watch just database import
docker logs infra-postgres-1 -f
```

**Look for these messages:**
```
🗄️ Starting database initialization...
📥 Found backup file, importing existing data...
✅ Database import completed successfully!
```

### 5. Verify Everything Works

#### Check Service Status
```bash
.\docker-manage.bat dev status
```

#### Test Database Connection
```bash
# Connect to database
docker exec -it infra-postgres-1 psql -U ev91user -d ev91db

# List your tables
\dt

# Check some data
SELECT count(*) FROM users;
SELECT count(*) FROM teams;

# Exit
\q
```

#### Test Service Health
```bash
# Auth service
curl http://localhost:4001/health

# API Gateway  
curl http://localhost:8000/health

# Team service (if running full environment)
curl http://localhost:3002/health
```

#### Test Admin Portal
1. Open: http://localhost:3000
2. Login with your existing credentials
3. Verify you can see your existing data

## 🔧 Troubleshooting

### Database Import Failed
```bash
# Check PostgreSQL logs
docker logs infra-postgres-1

# Common issues:
# 1. Backup file is empty - re-export your database
# 2. Permission issues - check file permissions
# 3. PostgreSQL version mismatch - check compatibility
```

### Services Won't Start
```bash
# Check individual service logs
docker logs infra-auth-service-1
docker logs infra-api-gateway-1

# Common issues:
# 1. Database not ready - wait for postgres health check
# 2. Port conflicts - kill processes using required ports
# 3. Missing environment variables - check .env.dev
```

### Port Already in Use
```bash
# Find what's using the port
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID 1234 /F

# Restart services
.\docker-manage.bat dev restart
```

## 📊 Expected Resources

### Development Environment (dev)
- **RAM**: ~2GB
- **CPU**: 2-4 cores
- **Startup Time**: 30-60 seconds
- **Services**: 5 essential

### Full Environment (full)  
- **RAM**: ~6GB
- **CPU**: 4-8 cores
- **Startup Time**: 2-3 minutes
- **Services**: 14 total

## 🎯 Success Indicators

✅ **Database Import**: "Database import completed successfully!"
✅ **All Services**: `docker ps` shows all containers running
✅ **Health Checks**: All `/health` endpoints return 200
✅ **Admin Portal**: Can login and see existing data
✅ **No Errors**: Service logs show no critical errors

## 📋 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Admin Portal | http://localhost:3000 | Main admin interface |
| API Gateway | http://localhost:8000 | Main API entry point |
| Auth Service | http://localhost:4001 | Authentication |
| Database | localhost:5432 | PostgreSQL (ev91user/ev91pass) |
| Redis | localhost:6379 | Cache/Sessions |

## 🔄 Daily Workflow

### Starting Work
```bash
cd infra
.\docker-manage.bat dev up
# Wait for services to be healthy (~30 seconds)
# Open http://localhost:3000
```

### Stopping Work
```bash
.\docker-manage.bat dev down
```

### Restarting Services
```bash
.\docker-manage.bat dev restart
```

### Viewing Logs
```bash
.\docker-manage.bat dev logs
```

Your existing database data is now safely preserved in Docker! 🎉
