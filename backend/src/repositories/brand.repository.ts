import { prisma } from '@config/database';
import type { Brand, Prisma } from '@prisma/client';

export interface BrandFilters {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface BrandRepository {
  findAll(filters: BrandFilters): Promise<{ data: Brand[]; total: number }>;
  findById(id: string): Promise<Brand | null>;
  findByName(name: string, excludeId?: string): Promise<Brand | null>;
  create(data: Prisma.BrandCreateInput): Promise<Brand>;
  update(id: string, data: Prisma.BrandUpdateInput): Promise<Brand>;
  softDelete(id: string): Promise<Brand>;
  existsById(id: string): Promise<boolean>;
}

export class BrandRepositoryImpl implements BrandRepository {
  async findAll(filters: BrandFilters): Promise<{ data: Brand[]; total: number }> {
    const { search, isActive, page, limit, sort = 'createdAt', order = 'desc' } = filters;

    const where: Prisma.BrandWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
      }),
      prisma.brand.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Brand | null> {
    return prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByName(name: string, excludeId?: string): Promise<Brand | null> {
    return prisma.brand.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
  }

  async create(data: Prisma.BrandCreateInput): Promise<Brand> {
    return prisma.brand.create({ data });
  }

  async update(id: string, data: Prisma.BrandUpdateInput): Promise<Brand> {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Brand> {
    return prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const brand = await prisma.brand.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return !!brand;
  }
}

export const brandRepository = new BrandRepositoryImpl();