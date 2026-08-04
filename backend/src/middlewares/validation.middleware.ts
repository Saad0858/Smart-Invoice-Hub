// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';
import { ZodError } from 'zod';
import { ApiError } from '@utils/api-error';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      await (schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as Promise<void>);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(ApiError.internal('Validation error'));
      }
    }
  };

export const validateBody = (schema: AnyZodObject) => validate(schema);
export const validateQuery = (schema: AnyZodObject) => validate(schema);
export const validateParams = (schema: AnyZodObject) => validate(schema);
