import { createApp } from './app';
import { env } from '@config/env';
import { connectDatabase, disconnectDatabase } from '@config/database';
import { logger } from '@utils/logger';

class Server {
  private app = createApp();
  private server: ReturnType<typeof this.app.listen> | null = null;
  private isShuttingDown = false;

  async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      // Start HTTP server
      this.server = this.app.listen(env.PORT, () => {
        logger.info(`🚀 Server started on port ${env.PORT}`, {
          port: env.PORT,
          env: env.NODE_ENV,
          apiPrefix: env.API_PREFIX,
        });
        logger.info(`📖 API Documentation: http://localhost:${env.PORT}/api-docs`);
        logger.info(`🏥 Health Check: http://localhost:${env.PORT}/health`);
      });

      // Handle server errors
      this.server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`❌ Port ${env.PORT} is already in use`);
        } else {
          logger.error('❌ Server error:', error);
        }
        process.exit(1);
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string): Promise<void> => {
      if (this.isShuttingDown) {
        return;
      }
      this.isShuttingDown = true;

      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      if (this.server) {
        this.server.close(async () => {
          logger.info('🔌 HTTP server closed');

          try {
            // Disconnect from database
            await disconnectDatabase();
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });

        // Force close after 10 seconds
        setTimeout(() => {
          logger.error('❌ Forced shutdown after timeout');
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('❌ Unhandled Rejection:', reason);
      shutdown('unhandledRejection');
    });
  }
}

const server = new Server();
server.start();

export default server;
