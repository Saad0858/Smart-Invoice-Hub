import { prisma } from '@config/database';
import type { Category, Prisma } from '@prisma/client';

export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface CategoryRepository {
  findAll(filters: CategoryFilters): Promise<{ data: Category[]; total: number }>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string, excludeId?: string): Promise<Category | null>;
  create(data: Prisma.CategoryCreateInput): Promise<Category>;
  update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category>;
  softDelete(id: string): Promise<Category>;
  existsById(id: string): Promise<boolean>;
}

export class CategoryRepositoryImpl implements CategoryRepository {
  async findAll(filters: CategoryFilters): Promise<{ data: Category[]; total: number }> {
    const { search, isActive, page, limit, sort = 'createdAt', order = 'desc' } = filters;

    const where: Prisma.CategoryWhereInput = {
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
      prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
      }),
      prisma.category.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByName(name: string, excludeId?: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return !!category;
  }
}

export const categoryRepository = new CategoryRepositoryImpl();