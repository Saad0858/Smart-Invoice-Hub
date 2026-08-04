import { healthRepository } from '@repositories/health.repository';
import { env } from '@config/env';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      version?: string;
      latency?: number;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export class HealthService {
  async getHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const dbHealthy = await healthRepository.checkDatabase();
    const dbLatency = Date.now() - startTime;
    const dbVersion = dbHealthy ? await healthRepository.getDatabaseVersion() : null;

    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

    const isHealthy = dbHealthy && memoryPercentage < 90;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      checks: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          version: dbVersion || undefined,
          latency: dbLatency,
        },
        memory: {
          status: memoryPercentage < 90 ? 'healthy' : 'unhealthy',
          used: memoryUsedMB,
          total: memoryTotalMB,
          percentage: memoryPercentage,
        },
      },
    };
  }

  async getSimpleHealth(): Promise<{ success: boolean; message: string; version: string }> {
    return {
      success: true,
      message: 'BillFlow API is running.',
      version: '1.0.0',
    };
  }
}

export const healthService = new HealthService();
