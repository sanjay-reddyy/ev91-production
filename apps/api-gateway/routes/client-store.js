const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_STORE_SERVICE_URL = process.env.CLIENT_STORE_SERVICE_URL || 'http://host.docker.internal:3004';

// Proxy client requests to client-store service
router.all('/clients/*', async (req, res) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}/api${req.path}`;
    
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
    console.error(`Client Store proxy error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Client Store service unavailable',
        error: error.message
      });
    }
  }
});

// Proxy store requests to client-store service
router.all('/stores/*', async (req, res) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}/api${req.path}`;
    
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
    console.error(`Client Store proxy error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Client Store service unavailable',
        error: error.message
      });
    }
  }
});

// Proxy rider earnings requests to client-store service
router.all('/rider-earnings/*', async (req, res) => {
  try {
    const targetUrl = `${CLIENT_STORE_SERVICE_URL}/api${req.path}`;
    
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
    console.error(`Client Store proxy error: ${error.message}`);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        success: false,
        message: 'Gateway error: Client Store service unavailable',
        error: error.message
      });
    }
  }
});

module.exports = router;
