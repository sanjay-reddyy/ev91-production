import winston, { format } from 'winston';

/**
 * Creates a logger instance with standardized formatting
 * @param service - Name of the service using the logger
 * @returns Winston logger instance
 */
export const createLogger = (service: string) => {
  return winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.metadata(),
      format.json()
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, service, metadata }) => {
            return `[${timestamp}] [${service}] ${level}: ${message} ${
              Object.keys(metadata as object).length > 1 ? JSON.stringify(metadata) : ''
            }`;
          })
        ),
      }),
    ],
  });
};

// Default logger for shared components
export const logger = createLogger('shared');
