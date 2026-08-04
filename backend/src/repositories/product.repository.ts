import { prisma } from '@config/database';
import type { Product, Prisma, Category, Brand } from '@prisma/client';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  gstRate?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page: number;
  limit: number;
  sort?: string;
  order: 'asc' | 'desc';
}

export interface ProductWithRelations extends Product {
  category: Category | null;
  brand: Brand | null;
}

export interface ProductRepository {
  findAll(filters: ProductFilters): Promise<{ data: ProductWithRelations[]; total: number }>;
  findById(id: string): Promise<ProductWithRelations | null>;
  findBySku(sku: string, excludeId?: string): Promise<Product | null>;
  findByBarcode(barcode: string, excludeId?: string): Promise<Product | null>;
  create(data: Prisma.ProductCreateInput): Promise<Product>;
  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product>;
  softDelete(id: string): Promise<Product>;
  existsById(id: string): Promise<boolean>;
  checkCategoryExists(categoryId: string): Promise<boolean>;
  checkBrandExists(brandId: string): Promise<boolean>;
  hasInvoiceItems(productId: string): Promise<boolean>;
}

export class ProductRepositoryImpl implements ProductRepository {
  async findAll(filters: ProductFilters): Promise<{ data: ProductWithRelations[]; total: number }> {
    const { search, categoryId, brandId, gstRate, isActive, lowStock, page, limit, sort = 'createdAt', order = 'desc' } = filters;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { hsnCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { searchKeywords: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (gstRate) {
      where.gstRate = gstRate as any;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (lowStock) {
      where.currentStock = { lte: prisma.product.fields.minStock };
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          category: true,
          brand: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<ProductWithRelations | null> {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async findBySku(sku: string, excludeId?: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: {
        sku: { equals: sku, mode: 'insensitive' },
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
  }

  async findByBarcode(barcode: string, excludeId?: string): Promise<Product | null> {
    if (!barcode) return null;
    return prisma.product.findFirst({
      where: {
        barcode: { equals: barcode, mode: 'insensitive' },
        deletedAt: null,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
    });
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async softDelete(id: string): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return !!product;
  }

  async checkCategoryExists(categoryId: string): Promise<boolean> {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });
    return !!category;
  }

  async checkBrandExists(brandId: string): Promise<boolean> {
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, deletedAt: null },
      select: { id: true },
    });
    return !!brand;
  }

  async hasInvoiceItems(productId: string): Promise<boolean> {
    const count = await prisma.invoiceItem.count({
      where: { productId },
    });
    return count > 0;
  }
}

export const productRepository = new ProductRepositoryImpl();