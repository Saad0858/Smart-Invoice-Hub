import request from 'supertest';
import { createApp } from '@src/app';
import { HTTP_STATUS, MESSAGES } from '@constants/index';

const app = createApp();

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return basic health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        success: true,
        message: MESSAGES.HEALTH_OK,
        version: '1.0.0',
      });
    });

    it('should include request ID in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(HTTP_STATUS.OK);

      expect(response.headers).toHaveProperty('x-request-id');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return simple health check', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(HTTP_STATUS.OK);

      expect(response.body).toEqual({
        success: true,
        message: MESSAGES.HEALTH_OK,
        version: '1.0.0',
      });
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('should return detailed health check', async () => {
      const response = await request(app)
        .get('/api/v1/health/detailed')
        .expect(HTTP_STATUS.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('checks');
      expect(response.body.data.checks).toHaveProperty('database');
      expect(response.body.data.checks).toHaveProperty('memory');
    });
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/v1/unknown')
      .expect(HTTP_STATUS.NOT_FOUND);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  });
});

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const response = await request(app)
      .get('/health')
      .expect(HTTP_STATUS.OK);

    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-frame-options');
    expect(response.headers).toHaveProperty('x-xss-protection');
  });

  it('should include CORS headers', async () => {
    const response = await request(app)
      .get('/health')
      .expect(HTTP_STATUS.OK);

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });
});

describe('Request ID Middleware', () => {
  it('should generate request ID if not provided', async () => {
    const response = await request(app)
      .get('/health')
      .expect(HTTP_STATUS.OK);

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('should use provided request ID', async () => {
    const customRequestId = 'custom-request-id-123';
    const response = await request(app)
      .get('/health')
      .set('X-Request-ID', customRequestId)
      .expect(HTTP_STATUS.OK);

    expect(response.headers['x-request-id']).toBe(customRequestId);
  });
});

describe('Compression', () => {
  it('should compress responses', async () => {
    const response = await request(app)
      .get('/health')
      .set('Accept-Encoding', 'gzip')
      .expect(HTTP_STATUS.OK);

    expect(response.headers['content-encoding']).toBe('gzip');
  });
});