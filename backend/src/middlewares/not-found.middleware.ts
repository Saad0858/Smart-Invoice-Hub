import type { Request, Response } from 'express';
import { notFoundHandler } from '@utils/api-error';

export const notFoundMiddleware = (req: Request, res: Response): void => {
  notFoundHandler(req, res);
};
