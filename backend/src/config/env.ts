import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  API_PREFIX: string;
  CLIENT_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;
  LOG_LEVEL: string;
  LOG_FORMAT: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  UPLOAD_MAX_SIZE: number;
  UPLOAD_ALLOWED_TYPES: string;
  // Storage
  STORAGE_PROVIDER: 'local' | 'supabase';
  STORAGE_BUCKET_NAME: string;
  STORAGE_BASE_URL: string;
  STORAGE_LOCAL_PATH: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

export const env: EnvConfig = {
  PORT: getEnvNumber('PORT', 3000),
  NODE_ENV: getEnv('NODE_ENV', 'development') as EnvConfig['NODE_ENV'],
  API_PREFIX: getEnv('API_PREFIX', '/api/v1'),
  CLIENT_URL: getEnv('CLIENT_URL', 'http://localhost:5173'),
  DATABASE_URL: getEnv('DATABASE_URL'),
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  BCRYPT_ROUNDS: getEnvNumber('BCRYPT_ROUNDS', 12),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
  LOG_FORMAT: getEnv('LOG_FORMAT', 'combined'),
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  UPLOAD_MAX_SIZE: getEnvNumber('UPLOAD_MAX_SIZE', 5242880),
  UPLOAD_ALLOWED_TYPES: getEnv('UPLOAD_ALLOWED_TYPES', 'image/jpeg,image/png,application/pdf'),
  // Storage
  STORAGE_PROVIDER: getEnv('STORAGE_PROVIDER', 'local') as EnvConfig['STORAGE_PROVIDER'],
  STORAGE_BUCKET_NAME: getEnv('STORAGE_BUCKET_NAME', 'smart-invoice-hub'),
  STORAGE_BASE_URL: getEnv('STORAGE_BASE_URL', ''),
  STORAGE_LOCAL_PATH: getEnv('STORAGE_LOCAL_PATH', './uploads'),
  SUPABASE_URL: getEnv('SUPABASE_URL', ''),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY', ''),
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
