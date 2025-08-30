const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const router = express.Router();

// Spare Parts Service Configuration
const SPARE_PARTS_SERVICE_URL = process.env.SPARE_PARTS_SERVICE_URL || 'http://localhost:4007';

console.log(`🔧 Spare Parts Service URL: ${SPARE_PARTS_SERVICE_URL}`);

// Proxy configuration for spare parts service
const sparePartsProxy = createProxyMiddleware({
  target: SPARE_PARTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // Custom path rewriting for better control
    console.log(`🔧 Original path: ${path}`);
    const rewrittenPath = path.replace(/^\/api\/spare-parts/, '/api/v1');
    console.log(`🔧 Rewritten path: ${rewrittenPath}`);
    return rewrittenPath;
  },
  onError: (err, req, res) => {
    console.error('Spare Parts Service proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Spare Parts Service temporarily unavailable',
      error: 'SERVICE_UNAVAILABLE'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔧 Proxying spare parts request: ${req.method} ${req.originalUrl} -> ${SPARE_PARTS_SERVICE_URL}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Spare parts response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
  }
});

// Documentation proxy (without authentication)
const docsProxy = createProxyMiddleware({
  target: SPARE_PARTS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/spare-parts/docs': '/docs',
    '^/api/spare-parts/docs-local': '/docs-local',
    '^/api/spare-parts/api-docs/yaml': '/api-docs/yaml',
    '^/api/spare-parts/api-docs/json': '/api-docs/json',
  },
  onError: (err, req, res) => {
    console.error('Spare Parts Documentation proxy error:', err);
    res.status(503).json({
      success: false,
      message: 'Spare Parts Documentation temporarily unavailable',
      error: 'DOCS_SERVICE_UNAVAILABLE'
    });
  }
});

// Routes for documentation (no auth required)
router.use('/docs*', docsProxy);
router.use('/api-docs*', docsProxy);

// All other spare-parts routes (with auth)
router.use('/', sparePartsProxy);

module.exports = router;
