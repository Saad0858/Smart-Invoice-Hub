import { prisma } from '@config/database';
import type { CompanySettings } from '@prisma/client';

export interface CompanySettingsRepository {
  find(): Promise<CompanySettings | null>;
  update(data: Partial<CompanySettings>): Promise<CompanySettings>;
}

export class CompanySettingsRepositoryImpl implements CompanySettingsRepository {
  async find(): Promise<CompanySettings | null> {
    return prisma.companySettings.findFirst();
  }

  async update(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const settings = await prisma.companySettings.findFirst();

    if (!settings) {
      return prisma.companySettings.create({
        data: data as any,
      });
    }

    return prisma.companySettings.update({
      where: { id: settings.id },
      data,
    });
  }
}

export const companySettingsRepository = new CompanySettingsRepositoryImpl();