const express = require('express');
const axios = require('axios');
const router = express.Router();

const TEAM_SERVICE_URL = process.env.TEAM_SERVICE_URL || 'http://host.docker.internal:3002';

// Proxy all team requests to team service
router.all('/*', async (req, res) => {
  try {
    const targetUrl = `${TEAM_SERVICE_URL}/api${req.path}`;
    
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

module.exports = router;
