import { prisma } from '@config/database';

export class HealthRepository {
  async checkDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async getDatabaseVersion(): Promise<string | null> {
    try {
      const result = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
      return result[0]?.version || null;
    } catch {
      return null;
    }
  }
}

export const healthRepository = new HealthRepository();
