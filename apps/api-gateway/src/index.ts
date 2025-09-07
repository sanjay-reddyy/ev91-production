import express, { Application, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import vehicleRoutes from "./routes/vehicles";
import hubRoutes from "./routes/hubs";
import clientStoreRoutes from "./routes/client-store";
import riderRoutes from "./routes/riders";
import sparePartsRoutes from "./routes/spare-parts";

// Import middleware
import { authMiddleware } from "./middleware/auth";

const app: Application = express();

// CORS configuration - Allow all origins for development
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Always allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow all origins in development
      if (process.env.NODE_ENV === "development") return callback(null, true);
      // Check allowed origins in production
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
      "Origin",
      "Accept",
    ],
    optionsSuccessStatus: 200,
  })
);

// Additional CORS headers middleware to ensure headers are always present
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-API-Key,X-Request-Id,Origin,Accept"
  );
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting - disabled for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10000"), // Much higher limit for dev
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => {
    console.log(`Rate limiter check - NODE_ENV: ${process.env.NODE_ENV}`);
    return process.env.NODE_ENV === "development"; // Skip rate limiting in development
  },
});

// Apply rate limiting only in production
if (process.env.NODE_ENV === "production") {
  app.use("/api/", limiter);
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is running",
    timestamp: new Date().toISOString(),
    service: "api-gateway",
    version: "1.0.0",
  });
});

// Documentation endpoints - proxy to spare-parts service
app.get("/docs", async (req: Request, res: Response) => {
  try {
    const axios = (await import("axios")).default;
    const response = await axios.get("http://localhost:4006/docs", {
      headers: { ...req.headers, host: undefined },
      timeout: 10000,
    });
    res.setHeader("Content-Type", "text/html");
    res.send(response.data);
  } catch (error: any) {
    console.error("Error proxying docs endpoint:", error.message);
    res.status(503).send(`
      <html>
        <head><title>Documentation Unavailable</title></head>
        <body>
          <h1>API Documentation Temporarily Unavailable</h1>
          <p>The documentation service is currently unavailable. Please try again later.</p>
          <p>Error: ${error.message}</p>
          <p><a href="/health">Check API Gateway Health</a></p>
        </body>
      </html>
    `);
  }
});

app.get("/docs-local", async (req: Request, res: Response) => {
  try {
    const axios = (await import("axios")).default;
    const response = await axios.get("http://localhost:4006/docs-local", {
      headers: { ...req.headers, host: undefined },
      timeout: 10000,
    });
    res.setHeader("Content-Type", "text/html");
    res.send(response.data);
  } catch (error: any) {
    console.error("Error proxying docs-local endpoint:", error.message);
    res.status(503).send(`
      <html>
        <head><title>Local Documentation Unavailable</title></head>
        <body>
          <h1>Local API Documentation Temporarily Unavailable</h1>
          <p>The local documentation service is currently unavailable. Please try again later.</p>
          <p>Error: ${error.message}</p>
          <p><a href="/health">Check API Gateway Health</a></p>
        </body>
      </html>
    `);
  }
});

app.get("/api-docs/yaml", async (req: Request, res: Response) => {
  try {
    const axios = (await import("axios")).default;
    const response = await axios.get("http://localhost:4006/api-docs/yaml", {
      headers: { ...req.headers, host: undefined },
      timeout: 10000,
    });
    res.setHeader("Content-Type", "application/x-yaml");
    res.send(response.data);
  } catch (error: any) {
    console.error("Error proxying api-docs/yaml endpoint:", error.message);
    res.status(503).json({
      success: false,
      message: "OpenAPI YAML specification unavailable",
      error: error.message,
    });
  }
});

app.get("/api-docs/json", async (req: Request, res: Response) => {
  try {
    const axios = (await import("axios")).default;
    const response = await axios.get("http://localhost:4006/api-docs/json", {
      headers: { ...req.headers, host: undefined },
      timeout: 10000,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("Error proxying api-docs/json endpoint:", error.message);
    res.status(503).json({
      success: false,
      message: "OpenAPI JSON specification unavailable",
      error: error.message,
    });
  }
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "EV91 Platform API Gateway",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth/*",
      users: "/api/users/*",
      employees: "/api/employees/*",
      teams: "/api/teams/*",
      departments: "/api/departments/*",
      vehicles: "/api/vehicles/*",
      hubs: "/api/hubs/*",
      cities: "/api/cities/*",
      clients: "/api/clients/*",
      stores: "/api/stores/*",
      riders: "/api/riders/*",
      riderEarnings: "/api/rider-earnings/*",
      spareParts: "/api/spare-parts/*",
      "v1-auth": "/api/v1/auth/*",
      "v1-users": "/api/v1/users/*",
      "v1-employees": "/api/v1/employees/*",
      "v1-teams": "/api/v1/teams/*",
      "v1-departments": "/api/v1/departments/*",
      internal: "/api/internal/*",
    },
  });
});

// Handle preflight OPTIONS requests
app.options("*", (req: Request, res: Response) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-API-Key,X-Request-Id,Origin,Accept"
  );
  res.sendStatus(200);
});

// Apply authentication middleware to protected routes
app.use("/api/teams", authMiddleware);
app.use("/api/departments", authMiddleware);
app.use("/api/users", authMiddleware);
app.use("/api/employees", authMiddleware);
app.use("/api/roles", authMiddleware);
app.use("/api/permissions", authMiddleware);

// Apply authentication middleware to v1 protected routes
app.use("/api/v1/teams", authMiddleware);
app.use("/api/v1/departments", authMiddleware);
app.use("/api/v1/users", authMiddleware);
app.use("/api/v1/employees", authMiddleware);
app.use("/api/v1/roles", authMiddleware);
app.use("/api/v1/permissions", authMiddleware);

app.use("/api/vehicles", authMiddleware);
app.use("/api/hubs", authMiddleware);
app.use("/api/cities", authMiddleware);
app.use("/api/clients", authMiddleware);
app.use("/api/stores", authMiddleware);
app.use("/api/riders", authMiddleware);
app.use("/api/rider-earnings", authMiddleware);
app.use("/api/spare-parts", authMiddleware);

// Route configuration
app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes); // Users handled by auth service
app.use("/api/employees", authRoutes); // Employees handled by auth service
app.use("/api/roles", authRoutes); // Roles handled by auth service
app.use("/api/permissions", authRoutes); // Permissions handled by auth service
app.use("/api/teams", authRoutes); // Teams now handled by auth service
app.use("/api/departments", authRoutes); // Departments now handled by auth service

// Support for v1 API endpoints (for admin portal compatibility)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", authRoutes);
app.use("/api/v1/employees", authRoutes);
app.use("/api/v1/roles", authRoutes);
app.use("/api/v1/permissions", authRoutes);
app.use("/api/v1/teams", authRoutes);
app.use("/api/v1/departments", authRoutes);

// Internal API endpoints (for service-to-service and admin portal)
app.use("/api/internal", authRoutes); // Internal endpoints handled by auth service

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/hubs", hubRoutes); // Dedicated hub routes
app.use("/api/cities", hubRoutes); // Cities are handled by hub service
app.use("/api", clientStoreRoutes); // Handles /clients, /stores, /rider-earnings
app.use("/api/riders", riderRoutes);
app.use("/api/spare-parts", sparePartsRoutes);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error("Gateway error:", error);
  res.status(500).json({
    success: false,
    message: "Internal gateway error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 EV91 Platform API Gateway listening on port ${PORT} `);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Gateway endpoints: http://localhost:${PORT}/api/*`);
});
