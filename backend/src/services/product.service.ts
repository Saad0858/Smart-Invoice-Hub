import { productRepository } from '@repositories/product.repository';
import type { Product, GSTRate, ProductUnit } from '@prisma/client';
import { ApiError } from '@utils/api-error';

export interface CreateProductInput {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  hsnCode: string;
  gstRate: GSTRate;
  unit: ProductUnit;
  sellingPrice: number;
  openingStock?: number;
  minStock?: number;
  imageUrl?: string;
  searchKeywords?: string;
  createdBy?: string;
}

export interface UpdateProductInput {
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  categoryId?: string | null;
  brandId?: string | null;
  hsnCode?: string;
  gstRate?: GSTRate;
  unit?: ProductUnit;
  sellingPrice?: number;
  minStock?: number;
  imageUrl?: string;
  searchKeywords?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface ProductService {
  getAll(
    page: number,
    limit: number,
    search?: string,
    categoryId?: string,
    brandId?: string,
    gstRate?: string,
    isActive?: boolean,
    lowStock?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }>;
  getById(id: string): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product>;
  delete(id: string): Promise<void>;
}

export class ProductServiceImpl implements ProductService {
  async getAll(
    page: number,
    limit: number,
    search?: string,
    categoryId?: string,
    brandId?: string,
    gstRate?: string,
    isActive?: boolean,
    lowStock?: boolean,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } }> {
    const { data, total } = await productRepository.findAll({
      page,
      limit,
      search,
      categoryId,
      brandId,
      gstRate,
      isActive,
      lowStock,
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

  async getById(id: string): Promise<Product | null> {
    return productRepository.findById(id);
  }

  async create(input: CreateProductInput): Promise<Product> {
    // Validate SKU uniqueness
    const existingSku = await productRepository.findBySku(input.sku);
    if (existingSku) {
      throw ApiError.conflict('Product with this SKU already exists');
    }

    // Validate barcode uniqueness if provided
    if (input.barcode) {
      const existingBarcode = await productRepository.findByBarcode(input.barcode);
      if (existingBarcode) {
        throw ApiError.conflict('Product with this barcode already exists');
      }
    }

    // Validate category exists if provided
    if (input.categoryId) {
      const categoryExists = await productRepository.checkCategoryExists(input.categoryId);
      if (!categoryExists) {
        throw ApiError.badRequest('Category does not exist');
      }
    }

    // Validate brand exists if provided
    if (input.brandId) {
      const brandExists = await productRepository.checkBrandExists(input.brandId);
      if (!brandExists) {
        throw ApiError.badRequest('Brand does not exist');
      }
    }

    // Validate selling price > 0
    if (input.sellingPrice <= 0) {
      throw ApiError.badRequest('Selling price must be greater than 0');
    }

    // Validate opening stock >= 0
    if (input.openingStock !== undefined && input.openingStock < 0) {
      throw ApiError.badRequest('Opening stock must be greater than or equal to 0');
    }

    // Validate min stock >= 0
    if (input.minStock !== undefined && input.minStock < 0) {
      throw ApiError.badRequest('Minimum stock must be greater than or equal to 0');
    }

    return productRepository.create({
      sku: input.sku,
      barcode: input.barcode,
      name: input.name,
      description: input.description,
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
      brand: input.brandId ? { connect: { id: input.brandId } } : undefined,
      hsnCode: input.hsnCode,
      gstRate: input.gstRate,
      unit: input.unit,
      sellingPrice: input.sellingPrice,
      openingStock: input.openingStock || 0,
      currentStock: input.openingStock || 0,
      minStock: input.minStock || 0,
      imageUrl: input.imageUrl,
      searchKeywords: input.searchKeywords,
      createdBy: input.createdBy,
    });
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await productRepository.findById(id);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Validate SKU uniqueness if changed
    if (input.sku && input.sku !== product.sku) {
      const existingSku = await productRepository.findBySku(input.sku, id);
      if (existingSku) {
        throw ApiError.conflict('Product with this SKU already exists');
      }
    }

    // Validate barcode uniqueness if changed
    if (input.barcode && input.barcode !== product.barcode) {
      const existingBarcode = await productRepository.findByBarcode(input.barcode, id);
      if (existingBarcode) {
        throw ApiError.conflict('Product with this barcode already exists');
      }
    }

    // Validate category exists if provided
    if (input.categoryId !== undefined) {
      if (input.categoryId) {
        const categoryExists = await productRepository.checkCategoryExists(input.categoryId);
        if (!categoryExists) {
          throw ApiError.badRequest('Category does not exist');
        }
      }
      // null is allowed to remove category association
    }

    // Validate brand exists if provided
    if (input.brandId !== undefined) {
      if (input.brandId) {
        const brandExists = await productRepository.checkBrandExists(input.brandId);
        if (!brandExists) {
          throw ApiError.badRequest('Brand does not exist');
        }
      }
      // null is allowed to remove brand association
    }

    // Validate selling price > 0 if provided
    if (input.sellingPrice !== undefined && input.sellingPrice <= 0) {
      throw ApiError.badRequest('Selling price must be greater than 0');
    }

    // Validate min stock >= 0 if provided
    if (input.minStock !== undefined && input.minStock < 0) {
      throw ApiError.badRequest('Minimum stock must be greater than or equal to 0');
    }

    return productRepository.update(id, {
      sku: input.sku,
      barcode: input.barcode,
      name: input.name,
      description: input.description,
      category: input.categoryId !== undefined ? (input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true }) : undefined,
      brand: input.brandId !== undefined ? (input.brandId ? { connect: { id: input.brandId } } : { disconnect: true }) : undefined,
      hsnCode: input.hsnCode,
      gstRate: input.gstRate,
      unit: input.unit,
      sellingPrice: input.sellingPrice,
      minStock: input.minStock,
      imageUrl: input.imageUrl,
      searchKeywords: input.searchKeywords,
      isActive: input.isActive,
      updatedBy: input.updatedBy,
    });
  }

  async delete(id: string): Promise<void> {
    const product = await productRepository.findById(id);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Check if product has associated invoice items
    const hasInvoiceItems = await productRepository.hasInvoiceItems(id);
    if (hasInvoiceItems) {
      throw ApiError.conflict('Cannot delete product with associated invoices');
    }

    await productRepository.softDelete(id);
  }
}

export const productService = new ProductServiceImpl();