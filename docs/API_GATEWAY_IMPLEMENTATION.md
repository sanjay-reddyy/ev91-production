# EV91 Platform - API Gateway Implementation

## 🎯 Purpose and Role

The **API Gateway** serves as the **single entry point** for all client requests in the EV91 Platform microservices architecture. It acts as a reverse proxy that routes requests to appropriate backend services.

## 🏗️ Architecture Benefits

### Before API Gateway (Direct Service Calls)
```
Frontend → Auth Service (port 4001)
Frontend → Team Service (port 3002)  
Frontend → Vehicle Service (port 4003)
Frontend → Client Store Service (port 3004)
Frontend → Rider Service (port 4004)
```

**Problems:**
- Frontend needs to know all service URLs and ports
- No centralized authentication
- Difficult to manage CORS policies
- No rate limiting across services
- Hard to monitor and log requests

### After API Gateway (Centralized Routing)
```
Frontend → API Gateway (port 8000) → Backend Services
```

**Benefits:**
- ✅ **Single Entry Point**: Frontend only needs Gateway URL
- ✅ **Centralized Authentication**: JWT validation in one place
- ✅ **Unified CORS Policy**: Consistent across all services
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Request Routing**: Intelligent service discovery
- ✅ **Load Balancing**: Future scalability
- ✅ **Monitoring**: Centralized logging and metrics

## 🔧 Implementation Details

### Technology Stack
- **Language**: TypeScript
- **Framework**: Express.js
- **Proxy**: Axios for HTTP forwarding
- **Authentication**: JWT middleware
- **Rate Limiting**: express-rate-limit
- **CORS**: Configurable origins

### Directory Structure
```
apps/api-gateway/
├── src/
│   ├── index.ts              # Main application
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication
│   └── routes/
│       ├── auth.ts           # Auth service proxy
│       ├── teams.ts          # Team service proxy
│       ├── vehicles.ts       # Vehicle service proxy
│       ├── client-store.ts   # Client/Store service proxy
│       └── riders.ts         # Rider service proxy
├── Dockerfile               # Container configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## 🛣️ Request Routing

### API Endpoint Mapping
| Frontend Request | Gateway Route | Target Service | Internal URL |
|------------------|---------------|----------------|--------------|
| `/api/auth/*` | Auth Proxy | Auth Service | `http://auth-service:4001/api/v1/auth/*` |
| `/api/teams/*` | Team Proxy | Team Service | `http://host.docker.internal:3002/api/*` |
| `/api/departments/*` | Team Proxy | Team Service | `http://host.docker.internal:3002/api/*` |
| `/api/vehicles/*` | Vehicle Proxy | Vehicle Service | `http://host.docker.internal:4003/api/v1/vehicles/*` |
| `/api/clients/*` | Client Proxy | Client Store Service | `http://host.docker.internal:3004/api/*` |
| `/api/stores/*` | Store Proxy | Client Store Service | `http://host.docker.internal:3004/api/*` |
| `/api/riders/*` | Rider Proxy | Rider Service | `http://host.docker.internal:4004/api/v1/riders/*` |

### Request Flow Example
```
1. Frontend: POST http://localhost:8000/api/auth/login
2. Gateway: Validates rate limits, CORS
3. Gateway: Routes to http://auth-service:4001/api/v1/auth/login
4. Auth Service: Processes login
5. Gateway: Returns response to frontend
```

## 🔐 Security Features

### Authentication Middleware
- **JWT Validation**: Verifies tokens before forwarding requests
- **Public Routes**: Login, signup, password reset bypass auth
- **Header Forwarding**: Passes user context to services
- **Token Extraction**: Handles `Bearer` token format

### Rate Limiting
- **Window**: 60 seconds
- **Limit**: 100 requests per IP
- **Protection**: Prevents API abuse
- **Headers**: Returns rate limit information

### CORS Policy
- **Origins**: Configurable allowed origins
- **Credentials**: Supports cookie-based auth
- **Methods**: GET, POST, PUT, DELETE, PATCH
- **Headers**: Content-Type, Authorization

## 🚀 Deployment Configuration

### Docker Setup
```yaml
api-gateway:
  build:
    context: ../apps/api-gateway
    dockerfile: Dockerfile
  ports:
    - "8000:4000"
  environment:
    - PORT=4000
    - JWT_SECRET=super-secret-jwt-key-for-ev91-auth-service-change-in-production
    - AUTH_SERVICE_URL=http://auth-service:4001
    - TEAM_SERVICE_URL=http://host.docker.internal:3002
    - VEHICLE_SERVICE_URL=http://host.docker.internal:4003
    - CLIENT_STORE_SERVICE_URL=http://host.docker.internal:3004
    - RIDER_SERVICE_URL=http://host.docker.internal:4004
```

### Environment Variables
- `PORT`: Gateway listening port (default: 4000)
- `JWT_SECRET`: Secret for token validation
- `CORS_ORIGIN`: Allowed frontend origins
- `*_SERVICE_URL`: Backend service URLs
- `RATE_LIMIT_*`: Rate limiting configuration

## 📊 Frontend Integration

### Before (Multiple URLs)
```typescript
// apps/admin-portal/.env
VITE_AUTH_SERVICE_URL=http://localhost:4001/api/v1
VITE_TEAM_API_URL=http://localhost:3002/api
VITE_VEHICLE_API_URL=http://localhost:4003/api/v1
VITE_CLIENT_STORE_API_URL=http://localhost:3004/api
```

### After (Single URL)
```typescript
// apps/admin-portal/.env
VITE_API_URL=http://localhost:8000/api
VITE_AUTH_SERVICE_URL=http://localhost:8000/api/auth
VITE_TEAM_API_URL=http://localhost:8000/api
VITE_VEHICLE_API_URL=http://localhost:8000/api
VITE_CLIENT_STORE_API_URL=http://localhost:8000/api
```

## 🔍 Monitoring and Debugging

### Health Checks
- **Gateway Health**: `GET /health`
- **Service Status**: Proxy responses indicate backend health
- **Rate Limit Info**: Headers show current limits

### Logging
- **Request Routing**: Console logs for proxy attempts
- **Error Handling**: Detailed error messages
- **Authentication**: JWT validation logs

### Testing
```bash
# Test gateway health
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ev91.com","password":"SuperAdmin123!"}'

# Test protected endpoint
curl http://localhost:8000/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Why This Matters

### Development Benefits
1. **Simplified Frontend**: One URL to remember
2. **Consistent API**: Unified response format
3. **Easy Testing**: Single endpoint for all features
4. **Better Debugging**: Centralized request logging

### Production Benefits
1. **Scalability**: Can scale services independently
2. **Security**: Centralized authentication and validation
3. **Monitoring**: Single point for metrics collection
4. **Maintenance**: Update service URLs without frontend changes

### DevOps Benefits
1. **Service Discovery**: Gateway handles internal routing
2. **Load Balancing**: Can distribute traffic across instances
3. **Circuit Breaking**: Can handle service failures gracefully
4. **API Versioning**: Future support for v1, v2 APIs

## 🚀 Future Enhancements

1. **Service Discovery**: Dynamic service registration
2. **Circuit Breaker**: Fault tolerance for failed services
3. **Caching**: Response caching for better performance
4. **Metrics**: Prometheus/Grafana integration
5. **Tracing**: Distributed request tracing
6. **WebSocket**: Real-time communication support

## 📋 Current Status

✅ **Implemented**:
- TypeScript-based Gateway
- Request routing to all services  
- JWT authentication middleware
- Rate limiting and CORS
- Docker containerization
- Frontend integration

✅ **Working**:
- Health checks
- Authentication routing
- Protected endpoint access
- Error handling
- Request forwarding

🎉 **Result**: The EV91 Platform now has a proper microservices architecture with a centralized API Gateway that provides a clean, secure, and scalable entry point for all client requests!
