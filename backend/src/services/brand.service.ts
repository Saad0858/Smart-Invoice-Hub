import { brandRepository } from '@repositories/brand.repository';
import type { Brand } from '@prisma/client';
import { ApiError } from '@utils/api-error';

export interface CreateBrandInput {
  name: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateBrandInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface BrandService {
  getAll(
    page: number,
    limit: number,
    search?: string,
    isActive?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Brand[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }>;
  getById(id: string): Promise<Brand | null>;
  create(input: CreateBrandInput): Promise<Brand>;
  update(id: string, input: UpdateBrandInput): Promise<Brand>;
  delete(id: string): Promise<void>;
}

export class BrandServiceImpl implements BrandService {
  async getAll(
    page: number,
    limit: number,
    search?: string,
    isActive?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Brand[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
    const { data, total } = await brandRepository.findAll({
      page,
      limit,
      search,
      isActive,
      sort,
      order: order || 'desc',
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: string): Promise<Brand | null> {
    return brandRepository.findById(id);
  }

  async create(input: CreateBrandInput): Promise<Brand> {
    // Check if brand with same name already exists
    const existing = await brandRepository.findByName(input.name);
    if (existing) {
      throw ApiError.conflict('Brand with this name already exists');
    }

    return brandRepository.create({
      name: input.name,
      description: input.description,
      createdBy: input.createdBy,
    });
  }

  async update(id: string, input: UpdateBrandInput): Promise<Brand> {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    // Check if new name conflicts with another brand
    if (input.name && input.name !== brand.name) {
      const existing = await brandRepository.findByName(input.name, id);
      if (existing) {
        throw ApiError.conflict('Brand with this name already exists');
      }
    }

    return brandRepository.update(id, {
      name: input.name,
      description: input.description,
      isActive: input.isActive,
      updatedBy: input.updatedBy,
    });
  }

  async delete(id: string): Promise<void> {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    await brandRepository.softDelete(id);
  }
}

export const brandService = new BrandServiceImpl();