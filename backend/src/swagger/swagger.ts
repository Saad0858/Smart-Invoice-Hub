import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import fs from 'fs';
import type { Application } from 'express';
import { env } from '@config/env';

// Load OpenAPI YAML
const swaggerDocument = YAML.load(
  path.join(__dirname, 'docs', 'openapi.yaml')
) as Record<string, any>;

// Inject dynamic server URL
const appUrl =
  process.env.APP_URL ||
  `http://localhost:${process.env.PORT || 3000}`;

swaggerDocument.servers = [
  {
    url: `${appUrl}${process.env.API_PREFIX || '/api/v1'}`,
    description:
      process.env.NODE_ENV === 'production'
        ? 'Production Server'
        : 'Development Server',
  },
];

export const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #2563eb; }
    .swagger-ui .scheme-container {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 0.5rem;
    }
  `,
  customSiteTitle: 'Smart Invoice Hub API',
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
  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';

  if (!swaggerEnabled) {
    return;
  }

  // Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerOptions)
  );

  // OpenAPI JSON
  app.get('/openapi.json', (_req, res) => {
    res.json(swaggerDocument);
  });

  // OpenAPI YAML
  app.get('/openapi.yaml', (_req, res) => {
    const yamlPath = path.join(__dirname, 'docs', 'openapi.yaml');

    res.setHeader('Content-Type', 'application/yaml');
    res.send(fs.readFileSync(yamlPath, 'utf8'));
  });

  // Development redirect
  if (env.NODE_ENV === 'development') {
    app.get('/', (_req, res) => {
      res.redirect('/api-docs');
    });
  }
};

export default {
  setupSwagger,
  swaggerOptions,
};