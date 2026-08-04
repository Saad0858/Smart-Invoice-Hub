export interface IRepository<T, CreateDto, UpdateDto, FilterDto = Record<string, unknown>> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: FilterDto): Promise<T[]>;
  findPaginated(
    filter: FilterDto,
    page: number,
    limit: number
  ): Promise<{ data: T[]; total: number }>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

export interface IService<T, CreateDto, UpdateDto, FilterDto = Record<string, unknown>> {
  getById(id: string): Promise<T>;
  getAll(filter?: FilterDto): Promise<T[]>;
  getPaginated(
    filter: FilterDto,
    page: number,
    limit: number
  ): Promise<{ data: T[]; total: number }>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface IController {
  registerRoutes(): void;
}
