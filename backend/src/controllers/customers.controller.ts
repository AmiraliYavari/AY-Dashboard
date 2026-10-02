import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { Customer } from '../types/models';
import { cleanText, likePattern, toId } from '../utils/validate';

const STATUSES = ['active', 'inactive'];

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const search = raw ? likePattern(raw) : '%';
    const { rows } = await pool.query<Customer>(
      `SELECT * FROM customers WHERE name ILIKE $1 OR company ILIKE $1 ORDER BY created_at DESC, id DESC`,
      [search]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Partial<Customer>;
    const name = cleanText(body.name);
    const status = body.status ?? 'active';
    if (!name) {
      res.status(400).json({ message: 'نام مشتری الزامی است.' });
      return;
    }
    if (!STATUSES.includes(status)) {
      res.status(400).json({ message: 'وضعیت مشتری نامعتبر است.' });
      return;
    }

    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO customers (name, email, phone, company, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, cleanText(body.email), cleanText(body.phone), cleanText(body.company), status]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toId(req.params.id);
    const body = req.body as Partial<Customer>;
    const name = cleanText(body.name);
    const status = body.status ?? 'active';
    if (!id) {
      res.status(400).json({ message: 'شناسه مشتری نامعتبر است.' });
      return;
    }
    if (!name) {
      res.status(400).json({ message: 'نام مشتری الزامی است.' });
      return;
    }
    if (!STATUSES.includes(status)) {
      res.status(400).json({ message: 'وضعیت مشتری نامعتبر است.' });
      return;
    }

    const result = await pool.query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, company=$4, status=$5 WHERE id=$6`,
      [name, cleanText(body.email), cleanText(body.phone), cleanText(body.company), status, id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'مشتری یافت نشد.' });
      return;
    }
    res.json({ message: 'مشتری با موفقیت به‌روزرسانی شد.' });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toId(req.params.id);
    if (!id) {
      res.status(400).json({ message: 'شناسه مشتری نامعتبر است.' });
      return;
    }
    const result = await pool.query(`DELETE FROM customers WHERE id=$1`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'مشتری یافت نشد.' });
      return;
    }
    res.json({ message: 'مشتری حذف شد.' });
  } catch (err) {
    next(err);
  }
}
