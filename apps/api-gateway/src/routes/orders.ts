import express, { Request, Response, Router } from "express";
import axios from "axios";

const router: Router = express.Router();

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:4005";

// Proxy order requests to order service
router.all("/", async (req: Request, res: Response) => {
  try {
    const targetUrl = `${ORDER_SERVICE_URL}/api/orders`;

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
    console.error(`Order Service proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Order Service unavailable",
        error: error.message,
      });
    }
  }
});

router.all("/*", async (req: Request, res: Response) => {
  try {
    const targetUrl = `${ORDER_SERVICE_URL}/api/orders${req.path}`;

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
    console.error(`Order Service proxy error: ${error.message}`);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: "Gateway error: Order Service unavailable",
        error: error.message,
      });
    }
  }
});

export default router;
