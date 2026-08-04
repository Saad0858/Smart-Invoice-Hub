import { prisma } from '@config/database';
import type { User } from '@prisma/client';

export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateLastLogin(id: string): Promise<void>;
}

export class AuthRepositoryImpl implements AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }
}

export const authRepository = new AuthRepositoryImpl();