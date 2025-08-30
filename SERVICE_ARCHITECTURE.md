# EV91 Platform - Service Architecture & Configuration

## 🎯 CURRENT SERVICE DEPLOYMENT

### 🐳 DOCKER SERVICES (Containerized)
```
Port    Service           Purpose                    Status
─────   ──────────────    ─────────────────────     ──────
5432    PostgreSQL        Primary Database          ✅ Running
6379    Redis             Cache & Sessions          ✅ Running  
3001    Admin Portal      Web UI (Vite Build)       ✅ Running
8000    API Gateway       Request Router            ✅ Running
```

### 💻 TERMINAL SERVICES (VS Code Tasks)
```
Port    Service           Purpose                    Status
─────   ──────────────    ─────────────────────     ──────
4001    Auth Service      Authentication            ✅ Running
3002    Team Service      Departments & Teams       ✅ Running
4003    Vehicle Service   Fleet Management          ✅ Running
4004    Rider Service     Rider Registration        ✅ Running
3004    Client Store      Client & Store Mgmt       ✅ Running
```

## 🔧 API ENDPOINT MAPPING

### Frontend → Backend Service Routing
```
Frontend Feature          API Endpoint                    Target Service
──────────────────────    ─────────────────────────────   ──────────────
Authentication            /api/v1/auth/*                  Auth Service :4001
Departments               /api/departments                 Team Service :3002
Teams                     /api/teams                       Team Service :3002
Vehicles                  /api/v1/vehicles                 Vehicle Service :4003
Riders                    /api/v1/riders                   Rider Service :4004
Clients/Stores            /api/clients, /api/stores        Client Store :3004
```

## 🌐 ENVIRONMENT CONFIGURATION

### Admin Portal Docker Environment
```bash
VITE_API_URL=http://host.docker.internal:3002/api              # Team Service
VITE_AUTH_SERVICE_URL=http://host.docker.internal:4001         # Auth Service  
VITE_VEHICLE_API_URL=http://host.docker.internal:4003/api/v1   # Vehicle Service
VITE_CLIENT_STORE_API_URL=http://host.docker.internal:3004/api # Client Store
```

## 🚀 WHY THIS HYBRID APPROACH?

### Docker Services (Infrastructure)
- **Database & Cache**: Persistent, shared resources
- **Admin Portal**: Pre-built static assets, served via nginx
- **API Gateway**: Central routing point

### Terminal Services (Development)
- **Business Logic Services**: Hot-reload during development
- **Easier debugging**: Direct console output
- **Individual service management**: Start/stop independently

## 🎯 API CALL FLOW EXAMPLE

```
User Action: "Create Team"
├── Frontend (Docker :3001)
├── → POST http://host.docker.internal:4001/api/v1/auth/login
├──   ✅ Get JWT Token
├── → GET http://host.docker.internal:3002/api/departments  
├──   ✅ Load Departments (Team Service)
├── → POST http://host.docker.internal:3002/api/teams
└──   ✅ Create Team (Team Service)
```

## 🔍 TROUBLESHOOTING CHECKLIST

### If API calls fail:
1. ✅ Check service is running: `curl http://localhost:PORT/health`
2. ✅ Check CORS headers in service configuration  
3. ✅ Verify Docker can reach host: `host.docker.internal`
4. ✅ Confirm JWT token is being sent in Authorization header

### Current Known Issues FIXED:
- ✅ Departments API pointing to correct service (Team :3002)
- ✅ Docker environment using host.docker.internal
- ✅ Auth service working with simplified implementation

## 🎉 READY FOR TESTING!

All services are properly configured and running. The admin portal should now successfully:
- Authenticate users
- Load departments  
- Create teams
- Manage vehicles and riders
