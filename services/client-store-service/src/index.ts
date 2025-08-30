import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";

// Import routes
import clientRoutes from "./routes/clientRoutes";
import storeRoutes from "./routes/storeRoutes";
import riderEarningsRoutes from "./routes/riderEarningsRoutes";

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

// Apply authentication middleware to API routes (except health and some test routes)
// Temporarily disabled for testing
// app.use('/api/clients/:id', authMiddleware);
// app.use('/api', authMiddleware);

// API Routes
app.use("/api/clients", clientRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/rider-earnings", riderEarningsRoutes);

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
  console.log(
    `💰 Rider Earnings API: http://localhost:${PORT}/api/rider-earnings`
  );
});

export default app;
