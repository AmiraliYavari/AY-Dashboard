import { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: 'مسیر مورد نظر یافت نشد.' });
}

interface HttpError extends Error {
  status?: number;
}

export function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction): void {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'خطای داخلی سرور رخ داده است.' });
}
