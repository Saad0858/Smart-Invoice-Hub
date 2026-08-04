export const MESSAGES = {
  SUCCESS: 'Success',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  HEALTH_OK: 'BillFlow API is running.',
  DATABASE_CONNECTED: 'Database connected successfully',
  DATABASE_DISCONNECTED: 'Database disconnected successfully',
  SERVER_STARTED: 'Server started successfully',
  SERVER_STOPPED: 'Server stopped gracefully',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  TOKEN_INVALID: 'Invalid token',
  ACCESS_DENIED: 'Access denied',
  RESOURCE_EXISTS: 'Resource already exists',
} as const;

export type MessageKey = keyof typeof MESSAGES;
