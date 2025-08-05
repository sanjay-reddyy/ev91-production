import express, { Request, Response, Router } from 'express';
import axios from 'axios';

const router: Router = express.Router();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';

// Proxy all auth requests to auth service
router.all('/*', async (req: Request, res: Response) => {
  try {
    // Special handling for health endpoint
    let targetPath: string;
    if (req.path === '/health') {
      targetPath = '/health';
    } else {
      targetPath = `/api/v1/auth${req.path}`;
    }
    
    const targetUrl = `${AUTH_SERVICE_URL}${targetPath}`;
    
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
    console.error(`Auth proxy error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Auth service unavailable',
        error: error.message
      });
    }
  }
});

export default router;
