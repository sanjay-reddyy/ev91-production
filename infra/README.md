# EV91 Platform Docker Setup

This document describes the Docker containerization setup for the EV91 Platform, designed to reduce VS Code load and avoid port conflicts.

## Overview

The EV91 Platform is containerized with the following architecture:

### Port Allocation Strategy

To avoid conflicts and ensure organized development:

#### Frontend Applications (3000-3099)
- **Admin Portal**: `3000`
- **Mobile App (Expo)**: `19006` (Metro bundler), `19001` (DevTools)

#### Backend Services (3001-3099, 4000-4099, 6000+)
- **API Gateway**: `4000`
- **Auth Service**: `4001`
- **User Service**: `3001`
- **Team Service**: `3002`
- **Payment Service**: `4003`
- **Client Store Service**: `3004`
- **Vehicle Service**: `4004`
- **Order Service**: `3005`
- **Rider Service**: `6000`
- **Notification Service**: `3006`
- **Template Service**: `3007`

#### Infrastructure Services
- **PostgreSQL**: `5432`
- **Redis**: `6379`
- **Nginx (Production)**: `80`, `443`

## Docker Compose Configurations

### 1. Development (Essential Services) - `docker-compose.dev.yml`
**Recommended for daily development to reduce VS Code load**

Includes only essential services:
- PostgreSQL database
- Redis cache
- API Gateway
- Auth Service
- Admin Portal

**Usage:**
```bash
# Windows PowerShell
.\infra\docker-manage.ps1 dev up

# Linux/Mac Bash
./infra/docker-manage.sh dev up
```

### 2. Full Development - `docker-compose.yml`
**Use when you need all services running**

Includes all microservices for complete testing and integration work.

**Usage:**
```bash
# Windows PowerShell
.\infra\docker-manage.ps1 full up

# Linux/Mac Bash
./infra/docker-manage.sh full up
```

### 3. Production - `docker-compose.prod.yml`
**Production-ready configuration with load balancing**

Includes:
- All services optimized for production
- Nginx load balancer
- Service replication
- Health checks

**Usage:**
```bash
# Windows PowerShell
.\infra\docker-manage.ps1 prod up

# Linux/Mac Bash
./infra/docker-manage.sh prod up
```

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git repository cloned

### Start Development Environment

1. **Navigate to the project root:**
   ```bash
   cd c:\voice_project\EV91-Platform
   ```

2. **Start essential services (recommended):**
   ```bash
   # Windows
   .\infra\docker-manage.ps1 dev up
   
   # Linux/Mac
   ./infra/docker-manage.sh dev up
   ```

3. **Access services:**
   - Admin Portal: http://localhost:3000
   - API Gateway: http://localhost:4000
   - Auth Service: http://localhost:4001

### VS Code Integration

To reduce VS Code load, the VS Code tasks are configured to work alongside Docker:

1. **Use Docker for infrastructure** (databases, external services)
2. **Use VS Code tasks for individual service development** when needed
3. **Switch between modes** as required for your workflow

## Management Scripts

### Windows PowerShell (`docker-manage.ps1`)

```powershell
# Start development environment
.\infra\docker-manage.ps1 dev up

# Start all services
.\infra\docker-manage.ps1 full up

# View logs
.\infra\docker-manage.ps1 dev logs

# Stop services
.\infra\docker-manage.ps1 dev down

# Build fresh images
.\infra\docker-manage.ps1 dev build

# Clean up everything
.\infra\docker-manage.ps1 dev clean
```

### Linux/Mac Bash (`docker-manage.sh`)

```bash
# Start development environment
./infra/docker-manage.sh dev up

# Start all services
./infra/docker-manage.sh full up

# View logs
./infra/docker-manage.sh dev logs

# Stop services
./infra/docker-manage.sh dev down

# Build fresh images
./infra/docker-manage.sh dev build

# Clean up everything
./infra/docker-manage.sh dev clean
```

## Service Communication

Services communicate using Docker's internal networking:

### Internal URLs (Service-to-Service)
- `http://auth-service:4001`
- `http://user-service:3001`
- `http://team-service:3002`
- etc.

### External URLs (Browser/Client Access)
- `http://localhost:3000` (Admin Portal)
- `http://localhost:4000` (API Gateway)
- `http://localhost:4001` (Auth Service)
- etc.

## Environment Variables

Configuration is managed through `.env` files:

### Development Environment (`.env`)
```env
# Database
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=ev91db

# Security
JWT_SECRET=your-jwt-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
```

## Database Setup

Each service uses its own schema for isolation:
- `auth` - Auth Service
- `user` - User Service
- `team` - Team Service
- `payment` - Payment Service
- `client_store` - Client Store Service
- `vehicle` - Vehicle Service
- `order` - Order Service
- `rider` - Rider Service
- `notification` - Notification Service
- `template` - Template Service

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using a port
   netstat -ano | findstr :3000
   
   # Kill process using port
   taskkill /PID <PID> /F
   ```

2. **Docker not starting:**
   - Ensure Docker Desktop is running
   - Check Docker daemon status
   - Restart Docker Desktop

3. **Build failures:**
   ```bash
   # Clean build
   .\infra\docker-manage.ps1 dev clean
   .\infra\docker-manage.ps1 dev build
   ```

4. **Service connectivity issues:**
   ```bash
   # Check service logs
   .\infra\docker-manage.ps1 dev logs
   
   # Check service status
   .\infra\docker-manage.ps1 dev status
   ```

### Health Checks

All services include health check endpoints:
- `/health` - Basic health check
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe

### Performance Optimization

1. **Use development mode for fast iteration**
2. **Use volume mounts for hot reloading**
3. **Start only needed services**
4. **Monitor resource usage with `docker stats`**

## Migration from VS Code Tasks

### Before (VS Code Tasks)
```json
{
  "label": "Start Auth Service",
  "command": "npm",
  "args": ["run", "dev"],
  "options": {
    "cwd": "${workspaceFolder}/services/auth-service"
  }
}
```

### After (Docker + Selective VS Code)
1. **Use Docker for infrastructure and stable services**
2. **Use VS Code tasks only for active development services**
3. **Switch between modes as needed**

## Best Practices

1. **Start with `dev` environment** for daily work
2. **Use `full` environment** for integration testing
3. **Use `prod` environment** for production-like testing
4. **Monitor resource usage** and adjust as needed
5. **Keep environment variables secure**
6. **Regularly clean up** unused containers and images

## Support

For issues or questions:
1. Check this documentation
2. Review service logs
3. Check Docker daemon status
4. Consult team documentation
