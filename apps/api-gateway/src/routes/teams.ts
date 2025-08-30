import express, { Request, Response, Router } from 'express';
import axios from 'axios';

const router: Router = express.Router();

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL || 'http://team-service:3002';

// Proxy all team and department requests to team service
router.all('/*', async (req: Request, res: Response) => {
  try {
    let targetPath: string;
    
    // Special handling for health endpoint
    if (req.path === '/health') {
      targetPath = '/health';
    } else {
      // Map API Gateway routes to team service routes
      // When API Gateway routes /api/teams -> teamRoutes, req.path becomes the remainder
      // So /api/teams/123 becomes req.path = '/123' and req.originalUrl = '/api/teams/123'
      
      if (req.originalUrl.startsWith('/api/teams')) {
        // Map to team service: /api/teams + remainder
        targetPath = `/api/teams${req.path === '/' ? '' : req.path}`;
      } else if (req.originalUrl.startsWith('/api/departments')) {
        // Map to team service: /api/departments + remainder  
        targetPath = `/api/departments${req.path === '/' ? '' : req.path}`;
      } else {
        // Fallback - shouldn't happen with current routing
        targetPath = req.path;
      }
    }
    
    const targetUrl = `${TEAM_SERVICE_URL}${targetPath}`;
    
    console.log(`Team/Department proxy: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    
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
    console.error(`Team proxy error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Team service unavailable',
        error: error.message
      });
    }
  }
});

export default router;
