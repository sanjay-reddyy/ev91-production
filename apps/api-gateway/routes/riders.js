const express = require('express');
const axios = require('axios');
const router = express.Router();

const RIDER_SERVICE_URL = process.env.RIDER_SERVICE_URL || 'http://localhost:3004';

console.log(`🏍️  Rider Service URL: ${RIDER_SERVICE_URL}`);

// Proxy all rider requests to rider service
router.all('/*', async (req, res) => {
  try {
    // Handle different endpoint patterns
    let targetPath;
    if (req.path.startsWith('/register') || req.path.startsWith('/rider-register')) {
      // Registration endpoints: /api/riders/register/* or /api/riders/rider-register/* -> /api/v1/rider-register/*
      targetPath = req.path.replace('/register', '').replace('/rider-register', '');
      targetPath = `/api/v1/rider-register${targetPath}`;
    } else {
      // Regular rider endpoints: /api/riders/* -> /api/v1/riders/*
      targetPath = `/api/v1/riders${req.path}`;
    }
    
    const targetUrl = `${RIDER_SERVICE_URL}${targetPath}`;
    
    console.log(`🏍️  Proxying rider request: ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      params: req.query,
      timeout: 30000, // Increase timeout for potentially slower mobile connections
    });

    // Forward response headers
    Object.keys(response.headers).forEach(key => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key)) {
        res.set(key, response.headers[key]);
      }
    });

    console.log(`✅ Rider response: ${response.status} for ${req.method} ${req.originalUrl}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Rider proxy error for ${req.method} ${req.originalUrl}: ${error.message}`);
    
    if (error.response) {
      console.error(`Service responded with ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: 'Rider service is currently unavailable',
        error: 'Service connection refused',
        service: 'rider-service'
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({
        success: false,
        message: 'Rider service request timeout',
        error: 'Request timed out',
        service: 'rider-service'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Rider service unavailable',
        error: error.message,
        service: 'rider-service'
      });
    }
  }
});

module.exports = router;
