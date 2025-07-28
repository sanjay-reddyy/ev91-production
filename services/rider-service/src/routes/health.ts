import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { twilioService } from '../utils/twilio';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     description: Endpoint for Kubernetes liveness probe to check if service is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Endpoint for Kubernetes readiness probe to check if service is ready to receive traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready (DB connection issues)
 */
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'READY',
      checks: {
        database: {
          status: 'UP'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed', error);
    
    res.status(503).json({
      status: 'NOT_READY',
      checks: {
        database: {
          status: 'DOWN',
          error: error instanceof Error ? error.message : String(error)
        }
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /health/cors:
 *   get:
 *     summary: CORS test endpoint
 *     description: Simple endpoint to test CORS configuration from mobile app
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: CORS working correctly
 */
router.get('/cors', (req, res) => {
  res.status(200).json({
    message: 'CORS is working correctly!',
    origin: req.headers.origin || 'No origin header',
    userAgent: req.headers['user-agent'] || 'No user agent',
    timestamp: new Date().toISOString(),
    corsHeaders: {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
    }
  });
});

/**
 * Twilio SMS Service Health Check
 */
router.get('/twilio', (req, res) => {
  const healthStatus = twilioService.getHealthStatus();
  
  res.status(200).json({
    status: 'UP',
    ...healthStatus,
    timestamp: new Date().toISOString(),
    setupInstructions: !healthStatus.configured ? [
      '1. Sign up at https://twilio.com',
      '2. Get Account SID, Auth Token, and Phone Number from Console',
      '3. Update .env with TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER'
    ] : undefined
  });
});

export default router;
