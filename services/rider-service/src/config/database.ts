import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Create a singleton Prisma instance
const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };
