const express = require('express');
const axios = require('axios');
const router = express.Router();

const RIDER_SERVICE_URL = process.env.RIDER_SERVICE_URL || 'http://host.docker.internal:4004';

// Proxy all rider requests to rider service
router.all('/*', async (req, res) => {
  try {
    const targetUrl = `${RIDER_SERVICE_URL}/api/v1/riders${req.path}`;
    
    const response = await axios({
      method: req.method,
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
  } catch (error) {
    console.error(`Rider proxy error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Rider service unavailable',
        error: error.message
      });
    }
  }
});

module.exports = router;
