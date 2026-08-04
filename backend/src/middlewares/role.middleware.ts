import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@utils/api-error';
import { USER_ROLES } from '@constants/roles';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = requireRole(USER_ROLES.ADMIN);
export const requireManager = requireRole(USER_ROLES.ADMIN, USER_ROLES.MANAGER);
export const requireAccountant = requireRole(
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.ACCOUNTANT
);
export const requireSales = requireRole(
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.SALES
);