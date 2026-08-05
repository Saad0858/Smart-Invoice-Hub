import type { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import morgan from 'morgan';
import { env } from '@config/env';
import { securityMiddleware } from '@middlewares/security.middleware';
import { requestIdMiddleware } from '@utils/request-id';
import { requestLoggerMiddleware, morganMiddleware } from '@middlewares/request-logger.middleware';
import { globalErrorHandler, notFoundHandler } from '@utils/api-error';
import routes from '@routes/index';
import { setupSwagger } from '@/swagger';
import { logger } from '@utils/logger';

export const createApp = (): Application => {
  const app = express();

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Security middleware (Helmet, CORS, Compression)
  app.use(...securityMiddleware);

  // Request ID middleware (must be early)
  app.use(requestIdMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use(requestLoggerMiddleware);
  app.use(morganMiddleware);

  // Morgan HTTP logger
  if (env.NODE_ENV === 'development') {
    app.use(
      morgan(env.LOG_FORMAT, {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );
  }

  // Health check endpoint (before API routes)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'BillFlow API is running.',
      version: '1.0.0',
    });
  });

  // Swagger Documentation (before API prefix so it's at /api-docs not /api/v1/api-docs)
  setupSwagger(app);

  // API Routes
  app.use(env.API_PREFIX, routes);

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(
    globalErrorHandler as (err: Error, req: Request, res: Response, next: NextFunction) => void
  );

  return app;
};

export default createApp;
