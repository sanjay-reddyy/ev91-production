import { PrismaClient, Prisma } from '@prisma/client';

// Simple logger for database operations
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[DATABASE INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[DATABASE ERROR] ${message}`, error);
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[DATABASE WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DATABASE DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  }
};

/**
 * Database transaction wrapper for complex operations
 */
export class DatabaseTransaction {
  constructor(private prisma: PrismaClient) {}

  /**
   * Execute multiple database operations in a transaction
   */
  async execute<T>(operations: (prisma: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      const result = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
        return await operations(prisma);
      });
      
      logger.info('Database transaction completed successfully');
      return result;
    } catch (error) {
      logger.error('Database transaction failed:', error);
      throw error;
    }
  }

  /**
   * Execute operations with retry logic
   */
  async executeWithRetry<T>(
    operations: (prisma: Prisma.TransactionClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(operations);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Database transaction attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    logger.error(`Database transaction failed after ${maxRetries} attempts`);
    throw lastError!;
  }
}

/**
 * Repository base class for common database operations
 */
export abstract class BaseRepository<T> {
  constructor(
    protected prisma: PrismaClient,
    protected modelName: string
  ) {}

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.modelName].findUnique({
        where: { id }
      });
    } catch (error) {
      logger.error(`Error finding ${this.modelName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Create new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.modelName].create({
        data
      });
    } catch (error) {
      logger.error(`Error creating ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Update entity
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.modelName].update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error(`Error updating ${this.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    try {
      // @ts-ignore - Dynamic model access
      await this.prisma[this.modelName].delete({
        where: { id }
      });
    } catch (error) {
      logger.error(`Error deleting ${this.modelName}:`, error);
      throw error;
    }
  }
}

/**
 * Query builder for complex database queries
 */
export class QueryBuilder {
  private query: any = {};
  
  constructor(private prisma: PrismaClient, private model: string) {}

  where(conditions: Record<string, any>): this {
    this.query.where = { ...this.query.where, ...conditions };
    return this;
  }

  include(relations: Record<string, boolean | object>): this {
    this.query.include = { ...this.query.include, ...relations };
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query.orderBy = { ...this.query.orderBy, [field]: direction };
    return this;
  }

  take(limit: number): this {
    this.query.take = limit;
    return this;
  }

  skip(offset: number): this {
    this.query.skip = offset;
    return this;
  }

  async findMany(): Promise<any[]> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].findMany(this.query);
    } catch (error) {
      logger.error(`Error executing findMany query:`, error);
      throw error;
    }
  }

  async findFirst(): Promise<any | null> {
    try {
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].findFirst(this.query);
    } catch (error) {
      logger.error(`Error executing findFirst query:`, error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const { take, skip, include, ...countQuery } = this.query;
      // @ts-ignore - Dynamic model access
      return await this.prisma[this.model].count(countQuery);
    } catch (error) {
      logger.error(`Error executing count query:`, error);
      throw error;
    }
  }
}
