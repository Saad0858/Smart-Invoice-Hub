import type { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';
import { env } from '@config/env';

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.requestId;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

export const morganMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.originalUrl} - ${req.requestId}`);
  }
  next();
};
