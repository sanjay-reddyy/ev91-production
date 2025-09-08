import express, { Request, Response, Router } from "express";
import axios from "axios";

const router: Router = express.Router();

const CLIENT_STORE_SERVICE_URL =
  process.env.CLIENT_STORE_SERVICE_URL || "http://localhost:3006";

// Proxy client requests to client-store service
router.all("/clients", async (req: Request, res: Response) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}/api${req.path}`;

    // Forward headers properly, including authentication
    const forwardHeaders = {
      ...req.headers,
      host: undefined, // Remove host header to avoid conflicts
      "x-forwarded-for": req.ip,
      "x-forwarded-proto": req.protocol,
      "x-forwarded-host": req.get("host"),
    };

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: forwardHeaders,
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes to forward them
    });

    // Forward response headers (including CORS headers)
    Object.keys(response.headers).forEach((key) => {
      if (
        ![
          "content-encoding",
          "transfer-encoding",
          "connection",
          "content-length",
        ].includes(key.toLowerCase())
      ) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Client Store proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Client Store service unavailable",
        error: error.message,
      });
    }
  }
});

router.all("/clients/*", async (req: Request, res: Response) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}/api${req.path}`;

    // Forward headers properly, including authentication
    const forwardHeaders = {
      ...req.headers,
      host: undefined, // Remove host header to avoid conflicts
      "x-forwarded-for": req.ip,
      "x-forwarded-proto": req.protocol,
      "x-forwarded-host": req.get("host"),
    };

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: forwardHeaders,
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes to forward them
    });

    // Forward response headers (including CORS headers)
    Object.keys(response.headers).forEach((key) => {
      if (
        ![
          "content-encoding",
          "transfer-encoding",
          "connection",
          "content-length",
        ].includes(key.toLowerCase())
      ) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Client Store proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Client Store service unavailable",
        error: error.message,
      });
    }
  }
});

// Proxy store requests to client-store service
router.all("/stores", async (req: Request, res: Response) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}/api${req.path}`;

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      timeout: 10000,
    });

    // Forward response headers
    Object.keys(response.headers).forEach((key) => {
      if (
        !["content-encoding", "transfer-encoding", "connection"].includes(key)
      ) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Client Store proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Client Store service unavailable",
        error: error.message,
      });
    }
  }
});

router.all("/stores/*", async (req: Request, res: Response) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}/api${req.path}`;

    // Forward headers properly, including authentication
    const forwardHeaders = {
      ...req.headers,
      host: undefined, // Remove host header to avoid conflicts
      "x-forwarded-for": req.ip,
      "x-forwarded-proto": req.protocol,
      "x-forwarded-host": req.get("host"),
    };

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: forwardHeaders,
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes to forward them
    });

    // Forward response headers (including CORS headers)
    Object.keys(response.headers).forEach((key) => {
      if (
        ![
          "content-encoding",
          "transfer-encoding",
          "connection",
          "content-length",
        ].includes(key.toLowerCase())
      ) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Client Store proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Client Store service unavailable",
        error: error.message,
      });
    }
  }
});

// Note: Rider earnings functionality moved to rider-service

// Proxy internal endpoints to client-store service (city sync, etc.)
router.all("/internal/*", async (req: Request, res: Response) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}${req.path}`;

    // Forward headers properly, including authentication
    const forwardHeaders = {
      ...req.headers,
      host: undefined, // Remove host header to avoid conflicts
      "x-forwarded-for": req.ip,
      "x-forwarded-proto": req.protocol,
      "x-forwarded-host": req.get("host"),
    };

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: forwardHeaders,
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes to forward them
    });

    // Forward response headers (including CORS headers)
    Object.keys(response.headers).forEach((key) => {
      if (
        ![
          "content-encoding",
          "transfer-encoding",
          "connection",
          "content-length",
        ].includes(key.toLowerCase())
      ) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Client Store internal proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Client Store service unavailable",
        error: error.message,
      });
    }
  }
});

export default router;
