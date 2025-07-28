import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Add request ID to request for reference
  req.headers['x-request-id'] = requestId as string;
  
  // Log request
  console.log(`[REQUEST] ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
    ...(req.method !== 'GET' && { body: sanitizeBody(req.body) })
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    console.log(`[RESPONSE] ${req.method} ${req.path}`, {
      timestamp: new Date().toISOString(),
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ...(res.statusCode >= 400 && { errorBody: body })
    });
    
    return originalJson.call(this, body);
  };

  next();
};

const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const sanitizeBody = (body: any): any => {
  if (!body) return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};
