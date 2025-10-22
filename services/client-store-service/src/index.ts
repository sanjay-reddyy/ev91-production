import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";

// Import routes
import clientRoutes from "./routes/clientRoutes";
import storeRoutes from "./routes/storeRoutes";
import citySyncRoutes from "./routes/citySyncRoutes";
import cityRoutes from "./routes/cityRoutes";

// Import middleware
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5173",
  "http://localhost:8000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow all origins in development
      if (process.env.NODE_ENV === "development") return callback(null, true);
      // Check allowed origins in production
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Request-Id",
      "Origin",
      "Accept",
    ],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Client-Store Service is running",
    timestamp: new Date().toISOString(),
    service: "client-store-service",
    version: "1.0.0",
  });
});

// Public API Routes (no authentication required for dropdown data)
app.use("/cities", cityRoutes);

// Apply authentication middleware to API routes
console.log("🔐 Enabling authentication middleware for all API routes");
app.use("/api", authMiddleware);

// API Routes (protected)
app.use("/api/clients", clientRoutes);
app.use("/api/stores", storeRoutes);

// Public API Routes (no authentication required for dropdown data)
app.use("/api/v1/cities", cityRoutes);

// Internal sync routes (no auth required for service-to-service communication)
app.use("/internal", citySyncRoutes);

// Internal stores endpoint for service-to-service calls
app.get("/internal/stores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: store.id,
        storeName: store.storeName,
        storeCode: store.storeCode,
        city: store.city,
        clientName: store.client?.name,
      },
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch store",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Internal stores list endpoint for dropdowns (no auth)
app.get("/internal/stores", async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        storeName: true,
        storeCode: true,
        city: true,
      },
      orderBy: {
        storeCode: "asc",
      },
    });

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error("Error fetching stores list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stores list",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Internal cities list endpoint for dropdowns (no auth)
app.get("/internal/cities", async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    console.error("Error fetching cities list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cities list",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Graceful shutdown...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Graceful shutdown...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Client-Store Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Clients API: http://localhost:${PORT}/api/clients`);
  console.log(`🏪 Stores API: http://localhost:${PORT}/api/stores`);
});

export default app;
export { prisma };
