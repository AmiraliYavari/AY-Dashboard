import { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: 'مسیر مورد نظر یافت نشد.' });
}

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string; // PostgreSQL error code
}

export function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400)) {
    res.status(400).json({ message: 'ساختار درخواست نامعتبر است.' });
    return;
  }

  // Common PostgreSQL errors -> meaningful client errors instead of a blind 500
  switch (err.code) {
    case '23505': // unique_violation
      res.status(409).json({ message: 'این مقدار قبلاً ثبت شده است (مقدار تکراری).' });
      return;
    case '23503': // foreign_key_violation
      res.status(400).json({ message: 'مورد مرتبط (مثلاً مشتری) وجود ندارد.' });
      return;
    case '23514': // check_violation
    case '22P02': // invalid_text_representation
    case '22007': // invalid_datetime_format
    case '22008': // datetime_field_overflow
    case '22003': // numeric_value_out_of_range
      res.status(400).json({ message: 'مقادیر ارسال‌شده نامعتبر است.' });
      return;
  }

  console.error(err);
  const status = err.status || err.statusCode || 500;
  // never leak internal error text on 5xx
  res.status(status).json({
    message: status >= 500 ? 'خطای داخلی سرور رخ داده است.' : err.message || 'درخواست نامعتبر است.',
  });
}
