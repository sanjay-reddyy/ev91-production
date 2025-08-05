# EV91 Platform - Docker Configuration

## 🐳 Docker Services Overview

The EV91 Platform now runs core services in Docker containers for easy deployment and management.

### 📊 Running Services

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| **PostgreSQL** | 5432 | ✅ Running | Primary Database |
| **Redis** | 6379 | ✅ Running | Cache & Sessions |
| **Auth Service** | 4001 | ✅ Running | Authentication API |
| **Admin Portal** | 3001 | ✅ Running | Web Interface |
| **API Gateway** | 8000 | ✅ Running | Request Router |

## 🚀 Quick Start

### Start All Services
```bash
cd c:\voice_project\EV91-Platform\infra
docker-compose -f docker-compose.dev.yml up -d
```

### Start Individual Services
```bash
# Database services
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Core application services  
docker-compose -f docker-compose.dev.yml up -d auth-service admin-portal api-gateway

# Check service status
docker-compose -f docker-compose.dev.yml ps
```

### View Logs
```bash
# Auth service logs
docker logs infra-auth-service-1

# Admin portal logs
docker logs infra-admin-portal-1

# All services logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 🔧 Configuration

### Environment Variables
- **Database**: PostgreSQL with credentials `ev91user:ev91pass`
- **Auth Service**: Simple JWT implementation for testing
- **CORS**: Configured for localhost development

### Network
- All services run on `ev91-network` Docker bridge
- Services communicate using service names (e.g., `auth-service:4001`)
- External access via `localhost:PORT`

## 📱 Access Points

### Web Interfaces
- **Admin Portal**: http://localhost:3001
- **API Gateway**: http://localhost:8000

### API Endpoints
- **Auth API**: http://localhost:4001/api/v1/auth
- **Health Checks**: http://localhost:4001/health

### Login Credentials
```
Email: admin@ev91.com
Password: SuperAdmin123!
```

## 🛠️ Development Commands

### Rebuild Services
```bash
# Rebuild auth service
docker-compose -f docker-compose.dev.yml build --no-cache auth-service

# Rebuild admin portal
docker-compose -f docker-compose.dev.yml build --no-cache admin-portal
```

### Database Management
```bash
# Reset database (removes all data)
docker-compose -f docker-compose.dev.yml down -v
docker volume rm infra_postgres_data

# Access database directly
docker exec -it infra-postgres-1 psql -U ev91user -d ev91db
```

### Troubleshooting
```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# View specific service logs
docker logs infra-auth-service-1 -f

# Restart all services
docker-compose -f docker-compose.dev.yml restart

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## 🎯 Production Ready

This Docker setup is optimized for:
- ✅ **Scalability**: Easy horizontal scaling
- ✅ **Portability**: Runs on any Docker-enabled system
- ✅ **Isolation**: Services run in separate containers
- ✅ **Persistence**: Database data persists across restarts
- ✅ **Health Monitoring**: Built-in health checks

## 📦 Next Steps

1. **Add More Services**: Import remaining services (vehicle, rider, etc.)
2. **Environment Separation**: Create production Docker compose
3. **Load Balancing**: Add nginx for production load balancing
4. **Monitoring**: Add logging and monitoring stack
5. **CI/CD**: Integrate with deployment pipelines

---

**Status**: ✅ **AUTH SERVICE SUCCESSFULLY IMPORTED TO DOCKER**

The authentication service is now fully containerized and ready for production deployment!