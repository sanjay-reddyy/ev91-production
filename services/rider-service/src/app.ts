import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./openapi.json";
import { env } from "./config/env";
import { riderRegistrationRouter } from "./routes/riderRegistration";
import bookingRoutes from "./routes/booking";
import healthRoutes from "./routes/health";
import adminRidersRoutes from "./routes/adminRiders";
import citySyncRoutes from "./routes/citySyncRoutes";
import { errorHandler } from "./middleware/errorHandler";
import {
  requestId,
  requestLogger,
  rateLimitByEndpoint,
} from "./middleware/validation";
import { customCors } from "./middleware/auth";

// Initialize Express app
const app = express();

// Core middleware
app.use(requestId);
app.use(requestLogger);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(customCors);

// Security middleware
app.use(rateLimitByEndpoint(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Routes with versioning
const v1Router = express.Router();
v1Router.use("/health", healthRoutes);
v1Router.use("/rider-register", riderRegistrationRouter); // Comprehensive rider registration
v1Router.use("/booking", bookingRoutes);
v1Router.use("/", adminRidersRoutes); // Admin rider management routes

app.use("/api/v1", v1Router);

// Internal sync routes (no auth required for service-to-service communication)
app.use("/internal", citySyncRoutes);

// Swagger API documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Rider Service",
    version: "1.0.0",
    apiVersion: "v1",
    endpoints: {
      docs: "/docs",
      health: "/api/v1/health",
      "rider-register": "/api/v1/rider-register",
      booking: "/api/v1/booking",
    },
    features: [
      "Registration Flow",
      "KYC Verification",
      "Document Upload",
      "E-signature",
      "Booking Management",
    ],
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
