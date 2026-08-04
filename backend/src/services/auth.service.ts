import { authRepository } from '@repositories/auth.repository';
import { env } from '@config/env';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { User as PrismaUser } from '@prisma/client';
import type { JwtPayload, TokenPair } from '@/types/api';
import { ApiError } from '@utils/api-error';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: Omit<PrismaUser, 'password'>;
  tokens: TokenPair;
}

export interface AuthService {
  login(input: LoginInput): Promise<LoginResult>;
  getProfile(userId: string): Promise<Omit<PrismaUser, 'password'> | null>;
  verifyToken(token: string): Promise<JwtPayload>;
  generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair;
}

export class AuthServiceImpl implements AuthService {
  async login(input: LoginInput): Promise<LoginResult> {
    const user = await authRepository.findByEmail(input.email);

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await authRepository.updateLastLogin(user.id);

    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async getProfile(userId: string): Promise<Omit<PrismaUser, 'password'> | null> {
    const user = await authRepository.findById(userId);

    if (!user) {
      return null;
    }

    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid token');
      }
      throw ApiError.unauthorized('Token verification failed');
    }
  }

  generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthServiceImpl();