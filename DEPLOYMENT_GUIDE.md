# EV91 Platform Docker Deployment Guide

## 🚀 Quick Start

### Development Environment (Essential Services Only)
```bash
cd infra
./docker-manage.bat dev up
```

### Full Development Environment (All Services)
```bash
cd infra
./docker-manage.bat full up
```

### Production Environment
```bash
cd infra
./docker-manage.bat prod up
```

## 📋 Environment Overview

### 1. Development (`dev`)
**Purpose**: Daily development work
**Services**: 
- PostgreSQL Database
- Redis Cache
- API Gateway
- Auth Service
- Admin Portal

**Resource Usage**: ~2GB RAM
**Startup Time**: ~30 seconds

### 2. Full Development (`full`)
**Purpose**: Integration testing, full feature development
**Services**: All microservices (14 services total)
**Resource Usage**: ~6GB RAM
**Startup Time**: ~2 minutes

### 3. Production (`prod`)
**Purpose**: Production deployment
**Services**: All services with production optimizations
**Features**: 
- Service replicas (2x each)
- Resource limits
- Health checks
- SSL termination

## 🛠️ Management Commands

```bash
# Start services
./docker-manage.bat [dev|full|prod] up

# Stop services
./docker-manage.bat [dev|full|prod] down

# Restart services
./docker-manage.bat [dev|full|prod] restart

# Build images
./docker-manage.bat [dev|full|prod] build

# View logs
./docker-manage.bat [dev|full|prod] logs

# Check status
./docker-manage.bat [dev|full|prod] status

# Clean up everything
./docker-manage.bat [dev|full|prod] clean
```

## 🌐 Service URLs

### Development Environment
- **Admin Portal**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Auth Service**: http://localhost:4001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Full Development Environment
- **Admin Portal**: http://localhost:3000
- **Mobile App**: http://localhost:19006
- **API Gateway**: http://localhost:8000
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

### Production Environment
- **Frontend**: https://your-domain.com
- **API**: https://api.your-domain.com
- **Auth**: https://auth.your-domain.com

## 🔧 Configuration

### Environment Variables
- **Development**: `.env.dev`
- **Production**: `.env.prod`

### Database Configuration
```bash
# Development
POSTGRES_USER=ev91user
POSTGRES_PASSWORD=ev91dev_password
POSTGRES_DB=ev91_dev

# Production (set secure values)
POSTGRES_USER=ev91_prod_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ev91_production
```

### Security Configuration
```bash
# Development
JWT_SECRET=dev-jwt-secret-key

# Production (generate secure 256-bit key)
JWT_SECRET=your_very_secure_jwt_secret_key_here
```

## 📊 Monitoring & Logging

### View Service Logs
```bash
# All services
./docker-manage.bat dev logs

# Specific service
docker-compose --env-file .env.dev -f docker-compose.dev.yml logs auth-service

# Follow logs in real-time
docker-compose --env-file .env.dev -f docker-compose.dev.yml logs -f auth-service
```

### Service Health Checks
```bash
# Check service status
./docker-manage.bat dev status

# Test specific service health
curl http://localhost:4001/health  # Auth service
curl http://localhost:8000/health  # API Gateway
```

## 🚀 Production Deployment

### Prerequisites
1. **Server Requirements**:
   - 8GB+ RAM
   - 4+ CPU cores
   - 100GB+ storage
   - Docker & Docker Compose installed

2. **Domain & SSL**:
   - Domain name configured
   - SSL certificates obtained
   - DNS records pointing to server

### Deployment Steps

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd EV91-Platform/infra
   ```

2. **Configure Production Environment**:
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with your production values
   ```

3. **Set Up SSL Certificates**:
   ```bash
   mkdir -p ssl
   # Copy your SSL certificates to ssl/ directory
   ```

4. **Deploy Services**:
   ```bash
   ./docker-manage.bat prod up
   ```

5. **Verify Deployment**:
   ```bash
   ./docker-manage.bat prod status
   curl https://your-domain.com/health
   ```

### Production Scaling

#### Scale Specific Services
```bash
# Scale auth service to 3 replicas
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d --scale auth-service=3

# Scale API gateway to 5 replicas
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d --scale api-gateway=5
```

#### Load Balancing
- Nginx handles load balancing
- Services are load-balanced via Docker's internal DNS
- External load balancer (AWS ALB, etc.) can be added

## 🛟 Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check what's using a port
   netstat -ano | findstr :8000
   
   # Kill process using port
   taskkill /PID <process_id> /F
   ```

2. **Service Won't Start**:
   ```bash
   # Check logs
   docker-compose logs service-name
   
   # Rebuild service
   docker-compose build --no-cache service-name
   ```

3. **Database Connection Issues**:
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Verify database is healthy
   docker-compose ps postgres
   ```

4. **Network Issues**:
   ```bash
   # Check network connectivity
   docker network ls
   docker network inspect infra_ev91-network
   ```

### Performance Optimization

1. **Allocate More Resources**:
   ```bash
   # In Docker Desktop: Settings > Resources
   # Increase CPU and Memory allocation
   ```

2. **Use Development Environment**:
   ```bash
   # For daily development, use minimal services
   ./docker-manage.bat dev up
   ```

3. **Selective Service Starting**:
   ```bash
   # Start only specific services
   docker-compose --env-file .env.dev -f docker-compose.dev.yml up postgres redis auth-service api-gateway
   ```

## 📈 Benefits of This Architecture

### Development Benefits
- **Fast Iteration**: Start only what you need
- **Isolated Development**: Services don't interfere
- **Easy Debugging**: Individual service logs
- **Consistent Environment**: Same across team

### Production Benefits
- **Horizontal Scaling**: Scale services independently
- **High Availability**: Service replicas and health checks
- **Rolling Updates**: Update services without downtime
- **Resource Efficiency**: Optimized containers

### Operational Benefits
- **Easy Monitoring**: Centralized logging and metrics
- **Disaster Recovery**: Stateless services, data in volumes
- **CI/CD Ready**: Build and deploy individual services
- **Cloud Native**: Ready for Kubernetes migration

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          ssh user@server "cd /app && git pull && ./infra/docker-manage.sh prod restart"
```

### Service-Specific Deployment
```bash
# Deploy only auth service
docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d --no-deps auth-service
```
