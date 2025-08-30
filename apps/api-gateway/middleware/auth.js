const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Skip auth for health checks and public routes
    const publicRoutes = ['/health', '/api/auth/login', '/api/auth/signup', '/api/auth/forgot-password', '/api/auth/reset-password'];
    
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-ev91-auth-service-change-in-production';
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Gateway auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authMiddleware };
