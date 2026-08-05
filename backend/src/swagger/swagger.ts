import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { env } from '@config/env';
import type { Application } from 'express';

// Load swagger document synchronously
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml')) as Record<string, unknown>;

export const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #2563eb; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 1rem; border-radius: 0.5rem; }
  `,
  customSiteTitle: 'BillFlow API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

export const setupSwagger = (app: Application): void => {
  // Enable swagger in all environments, or configure via SWAGGER_ENABLED env var
  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';

  if (swaggerEnabled) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

    // Redirect root to docs in development
    if (env.NODE_ENV === 'development') {
      app.get('/', (_req, res) => {
        res.redirect('/api-docs');
      });
    }
  }
};

export default { setupSwagger, swaggerOptions };
