export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.ADMIN]: 5,
  [USER_ROLES.MANAGER]: 4,
  [USER_ROLES.SALES]: 3,
  [USER_ROLES.ACCOUNTANT]: 2,
  [USER_ROLES.VIEWER]: 1,
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLES.ADMIN]: ['*'],
  [USER_ROLES.MANAGER]: [
    'products:read',
    'products:write',
    'customers:read',
    'customers:write',
    'invoices:read',
    'invoices:write',
    'reports:read',
    'settings:read',
    'settings:write',
  ],
  [USER_ROLES.SALES]: [
    'products:read',
    'customers:read',
    'customers:write',
    'invoices:read',
    'invoices:write',
  ],
  [USER_ROLES.ACCOUNTANT]: [
    'products:read',
    'customers:read',
    'invoices:read',
    'invoices:write',
    'reports:read',
  ],
  [USER_ROLES.VIEWER]: ['products:read', 'customers:read', 'invoices:read', 'reports:read'],
};
