# Vehicle Inventory Management Service

## Architecture Overview

### Microservices Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │  Rider Service  │    │ Client Service  │
│     :3001       │    │     :4004       │    │     :3004       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Vehicle Service │
                    │     :4003       │
                    └─────────────────┘
                             │
                    ┌─────────────────┐
                    │   File Storage  │
                    │   (AWS S3/Local)│
                    └─────────────────┘
```

### Core Components
1. **Vehicle Management**: CRUD operations for vehicle inventory
2. **Service History**: Track maintenance and repairs
3. **Damage Management**: Record and track vehicle damage
4. **Media Management**: Handle photo uploads for documentation
5. **Status Tracking**: Monitor vehicle operational status
6. **Audit Logging**: Track all changes for compliance

### Technology Stack
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Prisma ORM (following your pattern)
- **File Storage**: AWS S3 (configurable for local development)
- **API**: RESTful with OpenAPI documentation
- **Authentication**: JWT integration with auth-service
- **Validation**: Express-validator for input validation

### Key Features
- Multi-tenant support (fleet operators)
- Real-time status updates
- Comprehensive audit trails
- Photo documentation workflow
- Service scheduling and tracking
- Damage claim management
- Reporting and analytics ready
