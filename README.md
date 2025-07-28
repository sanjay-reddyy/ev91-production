# EV91 Platform

Enterprise-level Electric Vehicle Rental Platform built with a modern microservices architecture.

## Project Overview

EV91 is a comprehensive platform for electric vehicle rental services that includes:

- Mobile app for riders
- Admin portal for operations management
- Microservices backend architecture
- Secure payment processing
- KYC verification system
- Fleet management capabilities

### Environment Setup

Each service uses a `.env` file. For the rider registration service, you need:
```
KYC_PROVIDER_URL=https://sandbox.kyc-provider.com/api
KYC_PROVIDER_KEY=your_kyc_api_key
ESIGN_PROVIDER_URL=https://sandbox.esign-provider.com/api
ESIGN_PROVIDER_KEY=your_esign_api_key
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name
DATABASE_URL=file:./dev.db
```

### Database Setup
Uses Prisma ORM. To set up:
```
npx prisma generate
npx prisma migrate dev --name init
```

### Running the Service
```
cd services/rider-service
npm install
npm run dev
```
Service runs on port 4002 by default.

### API Endpoints
- `POST /register-msg91/start` — Start registration, send OTP via MSG91
- `POST /register/verify-otp` — Verify OTP
- `POST /register/profile` — Submit profile and emergency details
- `POST /register/kyc` — Upload KYC docs (multipart/form-data, stored in S3)
- `GET /register/kyc-status/:riderId` — Check KYC status
- `POST /register/esign` — e-Sign rental agreement

All uploaded docs are linked to the rider in the DB and can be reviewed by admins later. MSG91, KYC, and e-sign providers are pluggable.

See `services/rider-service/README.md` for full details and request/response examples.
# EV91 Platform Monorepo

This repository contains a full-stack, microservices-based platform for EV91, including a mobile app, admin portal, API gateway, and backend microservices. The project is designed for scalable, maintainable, and production-ready deployments using modern best practices.

---

## 1. Monorepo Structure & Tooling

```
ev91-platform/
├── apps/
│   ├── mobile-app/            # React Native app for riders
│   ├── admin-portal/          # React Web app for employees/admins
│   └── api-gateway/           # Routes requests to backend services
│
├── services/                  # Microservices (modular APIs)
│   ├── auth-service/          # Login, JWT, roles
│   ├── user-service/          # Rider and employee profiles
│   ├── vehicle-service/       # Two-wheeler inventory & assignment
│   ├── handover-service/      # Employee-led onboarding
│   ├── job-service/           # Delivery job lifecycle
│   └── notification-service/  # SMS/Email/push messaging
│
├── shared/                    # Shared libraries, middlewares
│   └── auth-middleware/       # Role-based access
│
├── infra/                     # Docker, Kubernetes, CI/CD configs
├── docs/                      # API contracts, specs
└── README.md
```

---

## 2. Development Workflow

### a. Mobile App (`apps/mobile-app`)
- **Stack:** React Native (Expo), React Navigation, React Query
- **How to Start:**
  1. `cd apps/mobile-app`
  2. `npm install`
  3. `npx expo start`

### b. Admin Portal (`apps/admin-portal`)
- **Stack:** React + Vite, ShadCN UI, TanStack Table, React Hook Form
- **How to Start:**
  1. `cd apps/admin-portal`
  2. `npm install`
  3. `npm run dev`

### c. API Gateway (`apps/api-gateway`)
- **Stack:** Express, JWT Middleware
- **How to Start:**
  1. `cd apps/api-gateway`
  2. `npm install`
  3. `npm start`

### d. Microservices (`services/*`)
- **Stack:** Express, TypeScript, Prisma, Zod, PostgreSQL
- **How to Start:**
  1. `cd services/auth-service` (or other service)
  2. `npm install`
  3. Set up the database (see Docker below)
  4. `npx prisma migrate dev`
  5. `npm run dev`

---

## 3. Database & Local Development with Docker

- **Why Docker?**
  Docker lets you run PostgreSQL and other dependencies without installing them directly on your machine.
- **How to Start:**
  1. `cd infra`
  2. `docker compose up -d`
  3. Use the connection string from `.env.example` in your services.

---

## 4. Environment Variables

- Each service/app uses a `.env` file for secrets and config (never commit real secrets to git).
- Copy `.env.example` to `.env` and fill in the values.

---

## 5. Building & Running Everything

- Each app/service is started independently (in its own terminal).
- For local development, you can run all services and apps at once.
- For production, you’ll use Docker to build and run containers.

---

## 6. Dockerizing Apps & Services

- Each service/app should have a `Dockerfile` (can be generated for you).
- The `infra/docker-compose.yml` can be extended to run all services together.
- Example:
  - `docker build -t auth-service .` (in `services/auth-service`)
  - `docker run -p 4001:4001 auth-service`

---

## 7. CI/CD with Jenkins

- Jenkins automates build, test, and deployment.
- The `infra/Jenkinsfile` defines the pipeline.
- Typical steps:
  1. Build Docker images.
  2. Run tests.
  3. Deploy to server or cloud.

---

## 8. Best Practices

- Use TypeScript for type safety.
- Use `.env` for secrets.
- Write unit/integration tests for each service.
- Use Docker for consistent environments.
- Use CI/CD for automated, repeatable deployments.

---

## 9. How Everything Connects

- **Mobile App/Admin Portal** → API Gateway → Microservices (auth, user, vehicle, etc.) → PostgreSQL
- All backend services are REST APIs.
- API Gateway secures and routes requests.
- PostgreSQL is the shared database (each service can have its own schema).

---

## 10. Next Steps

- Generate example `Dockerfile`s, `.env` files, and starter code for any part.
- Scaffold end-to-end flows (e.g., user registration) as needed.

---

## Stack Overview

| Layer            | Tooling                                                  |
| ---------------- | -------------------------------------------------------- |
| Mobile App       | React Native (Expo), React Navigation, React Query       |
| Admin Portal     | React + Vite, ShadCN UI, TanStack Table, React Hook Form |
| API Gateway      | Express + JWT middleware                                 |
| Microservices    | Express + TypeScript + Prisma + Zod + PostgreSQL         |
| Auth             | Passport + bcrypt + JWT                                  |
| Database         | PostgreSQL (dev via Docker)                              |
| Deployment-ready | Docker + Jenkins CI/CD                                   |

---