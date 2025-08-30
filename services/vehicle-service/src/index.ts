import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { PrismaClient } from "@prisma/client";

// Import routes
import vehicleRoutes from "./routes/vehicles";
import serviceRoutes from "./routes/services";
import damageRoutes from "./routes/damage";
import handoverRoutes from "./routes/handover";
import mediaRoutes from "./routes/media";
import analyticsRoutes from "./routes/analytics";
import oemRoutes from "./routes/oems";
import vehicleModelRoutes from "./routes/vehicle-models";
import cityRoutes from "./routes/cities";
import hubRoutes from "./routes/hubs";
import documentRoutes from "./routes/documents";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { loggerMiddleware } from "./middleware/logger";

// Import OpenAPI spec
import * as openApiSpec from "./openapi.json";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5173",
];
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Request-Id",
  ],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(loggerMiddleware);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    service: "Vehicle Service",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API Documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API Routes - protected with auth middleware
app.use("/api/v1/vehicles", authMiddleware, vehicleRoutes);
app.use("/api/v1/service", authMiddleware, serviceRoutes);
app.use("/api/v1/damage", authMiddleware, damageRoutes);
app.use("/api/v1/handover", authMiddleware, handoverRoutes);
app.use("/api/v1/media", authMiddleware, mediaRoutes);
app.use("/api/v1/analytics", authMiddleware, analyticsRoutes); // Re-enabled analytics routes
app.use("/api/v1/oems", authMiddleware, oemRoutes);
app.use("/api/v1/vehicle-models", authMiddleware, vehicleModelRoutes);
app.use("/api/v1/cities", authMiddleware, cityRoutes);
app.use("/api/v1/hubs", authMiddleware, hubRoutes);
app.use("/api/v1/documents", authMiddleware, documentRoutes);

// Legacy compatibility
app.use("/vehicles", handoverRoutes); // Keep existing handover route

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Vehicle Inventory Management Service",
    version: "1.0.0",
    documentation: "/docs",
    health: "/health",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4004;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Vehicle Service listening on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
export default app;
