export const formatDate = (date: Date | string, format: string = 'YYYY-MM-DD'): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

export const generateInvoiceNumber = (prefix: string = 'INV'): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}${month}${day}-${random}`;
};

export const calculateGST = (
  amount: number,
  gstRate: number
): { gstAmount: number; total: number } => {
  const gstAmount = Number(((amount * gstRate) / 100).toFixed(2));
  const total = Number((amount + gstAmount).toFixed(2));
  return { gstAmount, total };
};

export const calculateDiscount = (amount: number, discountPercent: number): number => {
  return Number(((amount * discountPercent) / 100).toFixed(2));
};

export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const parsePaginationParams = (
  query: Record<string, unknown>
): { page: number; limit: number; sort?: string; order?: 'asc' | 'desc' } => {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  const sort = query.sort as string | undefined;
  const order = (query.order as 'asc' | 'desc') || 'asc';
  return { page, limit, sort, order };
};

export const buildPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[()]?[0-9]{1,3}[)]?[-\s.]?[()]?[0-9]{1,3}[)]?[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const maskString = (str: string, visibleChars: number = 4): string => {
  if (str.length <= visibleChars) {
    return '*'.repeat(str.length);
  }
  const masked = '*'.repeat(str.length - visibleChars);
  return masked + str.slice(-visibleChars);
};
