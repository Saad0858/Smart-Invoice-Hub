import { categoryRepository } from '@repositories/category.repository';
import type { Category } from '@prisma/client';
import { ApiError } from '@utils/api-error';

export interface CreateCategoryInput {
  name: string;
  description?: string;
  createdBy?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface CategoryService {
  getAll(
    page: number,
    limit: number,
    search?: string,
    isActive?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Category[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }>;
  getById(id: string): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category>;
  delete(id: string): Promise<void>;
}

export class CategoryServiceImpl implements CategoryService {
  async getAll(
    page: number,
    limit: number,
    search?: string,
    isActive?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Category[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
    const { data, total } = await categoryRepository.findAll({
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

  async getById(id: string): Promise<Category | null> {
    return categoryRepository.findById(id);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    // Check if category with same name already exists
    const existing = await categoryRepository.findByName(input.name);
    if (existing) {
      throw ApiError.conflict('Category with this name already exists');
    }

    return categoryRepository.create({
      name: input.name,
      description: input.description,
      createdBy: input.createdBy,
    });
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Check if new name conflicts with another category
    if (input.name && input.name !== category.name) {
      const existing = await categoryRepository.findByName(input.name, id);
      if (existing) {
        throw ApiError.conflict('Category with this name already exists');
      }
    }

    return categoryRepository.update(id, {
      name: input.name,
      description: input.description,
      isActive: input.isActive,
      updatedBy: input.updatedBy,
    });
  }

  async delete(id: string): Promise<void> {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Note: We allow soft delete even if products exist (they'll have null category)
    // This would require a separate query to check product count

    await categoryRepository.softDelete(id);
  }
}

export const categoryService = new CategoryServiceImpl();