import express, { Request, Response, Router } from 'express';
import axios from 'axios';

const router: Router = express.Router();

const VEHICLE_SERVICE_URL = process.env.VEHICLE_SERVICE_URL || 'http://vehicle-service:4003';

// Hub routes - proxy to vehicle service
router.all('/hubs/*', async (req: Request, res: Response) => {
  try {
    let cleanPath = req.path;
    
    // Remove /hubs prefix since we're already in the hubs route
    if (cleanPath.startsWith('/hubs')) {
      cleanPath = cleanPath.substring(5); // Remove '/hubs'
    }
    
    // Target path: /api/v1/hubs + clean path
    const targetPath = `/api/v1/hubs${cleanPath}`;
    const targetUrl = `${VEHICLE_SERVICE_URL}${targetPath}`;
    
    console.log(`[Hub API Gateway] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      timeout: 10000,
    });

    // Forward response headers
    Object.keys(response.headers).forEach(key => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key)) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Hub API Gateway error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Vehicle service unavailable',
        error: error.message
      });
    }
  }
});

// City routes - proxy to vehicle service
router.all('/cities/*', async (req: Request, res: Response) => {
  try {
    let cleanPath = req.path;
    
    // Remove /cities prefix since we're already in the cities route
    if (cleanPath.startsWith('/cities')) {
      cleanPath = cleanPath.substring(7); // Remove '/cities'
    }
    
    // Target path: /api/v1/cities + clean path
    const targetPath = `/api/v1/cities${cleanPath}`;
    const targetUrl = `${VEHICLE_SERVICE_URL}${targetPath}`;
    
    console.log(`[City API Gateway] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      timeout: 10000,
    });

    // Forward response headers
    Object.keys(response.headers).forEach(key => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key)) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`City API Gateway error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Vehicle service unavailable',
        error: error.message
      });
    }
  }
});

// Fallback for direct hub/city calls without prefix
router.all('/*', async (req: Request, res: Response) => {
  try {
    let targetPath = req.path;
    
    // Determine if this is a hub or city request based on the URL
    if (req.originalUrl.includes('/api/hubs')) {
      targetPath = `/api/v1/hubs${req.path}`;
    } else if (req.originalUrl.includes('/api/cities')) {
      targetPath = `/api/v1/cities${req.path}`;
    } else {
      // Default to hub if unclear
      targetPath = `/api/v1/hubs${req.path}`;
    }
    
    const targetUrl = `${VEHICLE_SERVICE_URL}${targetPath}`;
    
    console.log(`[Hub/City API Gateway] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    
    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined,
      },
      timeout: 10000,
    });

    Object.keys(response.headers).forEach(key => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key)) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`Hub/City API Gateway fallback error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Vehicle service unavailable',
        error: error.message
      });
    }
  }
});

export default router;
