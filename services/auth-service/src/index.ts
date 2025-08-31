import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { prisma } from "./config/database";
import authRoutes from "./routes/authRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import roleRoutes from "./routes/roleRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import teamRoutes from "./routes/teamRoutes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$connect();

    res.status(200).json({
      success: true,
      message: "Auth service is healthy",
      timestamp: new Date().toISOString(),
      service: "auth-service",
      version: "1.0.0",
      database: {
        status: "connected",
        type: "postgresql",
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Auth service is unhealthy",
      timestamp: new Date().toISOString(),
      service: "auth-service",
      error: (error as Error).message,
    });
  }
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "EV91 Auth Service API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      docs: "/api/docs",
      auth: "/api/v1/auth",
      employees: "/api/v1/employees",
      departments: "/api/v1/departments",
      teams: "/api/v1/teams",
      roles: "/api/v1/roles",
      permissions: "/api/v1/permissions",
    },
  });
});

// API Documentation
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(require("./openapi.json"))
);

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", employeeRoutes);
app.use("/api/v1", roleRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/teams", teamRoutes);

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: any) => {
  console.error("Error:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service listening on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
