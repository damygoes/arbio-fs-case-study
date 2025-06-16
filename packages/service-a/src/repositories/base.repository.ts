import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { AppDataSource } from '../config/database';

/**
 * Base repository with common CRUD operations
 * Provides type-safe foundation for all repositories
 */
export abstract class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repository = AppDataSource.getRepository(entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } } as any);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async create(data: Partial<T>): Promise<T | T[]> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const result = await this.repository.update(id, data as any);
    if (result.affected === 0) {
      return null;
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async count(): Promise<number> {
    return this.repository.count();
  }
}