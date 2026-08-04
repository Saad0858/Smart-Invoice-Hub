import type { Request, Response, NextFunction } from 'express';
import { authService } from '@services/auth.service';
import { ApiError } from '@utils/api-error';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authorization header missing or invalid');
    }

    const token = authHeader.substring(7);

    const decoded = await authService.verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Authentication failed'));
    }
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);

    req.user = decoded;
    next();
  } catch {
    next();
  }
};