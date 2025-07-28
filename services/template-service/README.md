# EV91 Microservice Template

This template defines the standard structure for EV91 platform microservices.

## Directory Structure
```
/
├── src/
│   ├── config/         # Configuration settings
│   ├── controllers/    # Request handlers
│   ├── middlewares/    # Custom middleware
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── validators/     # Input validation
│   ├── app.ts          # Express app setup
│   └── index.ts        # Entry point
├── prisma/             # Prisma ORM files (if applicable)
├── tests/              # Unit and integration tests
├── Dockerfile          # Containerization
├── .env.example        # Example environment variables
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md           # Service documentation
```

## Standard Scripts
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

## Environment Variables
Copy `.env.example` to `.env` and fill in your values.

## Health Endpoints
All services should implement:
- GET /health/live - Liveness check
- GET /health/ready - Readiness check (includes database connectivity)
