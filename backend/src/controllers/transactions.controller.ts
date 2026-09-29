import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const type = req.query.type as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();
    const params: string[] = [];
    const where: string[] = [];

    if (type === 'income' || type === 'expense') {
      params.push(type);
      where.push(`t.type = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(t.description ILIKE $${params.length} OR t.category ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
    }

    const { rows } = await pool.query(
      `SELECT t.id, t.type, t.category, t.amount, t.description, t.txn_date, t.customer_id, c.name AS customer_name
       FROM transactions t
       LEFT JOIN customers c ON c.id = t.customer_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY t.txn_date DESC, t.id DESC
       LIMIT 200`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, category, amount, customer_id, description, txn_date } = req.body as {
      type?: string; category?: string; amount?: number | string;
      customer_id?: number | null; description?: string; txn_date?: string;
    };
    if ((type !== 'income' && type !== 'expense') || !category || !amount || !txn_date) {
      res.status(400).json({ message: 'نوع، دسته، مبلغ و تاریخ تراکنش الزامی است.' });
      return;
    }
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO transactions (type, category, amount, customer_id, description, txn_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [type, category, amount, customer_id || null, description || null, txn_date]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pool.query(`DELETE FROM transactions WHERE id=$1`, [req.params.id]);
    res.json({ message: 'تراکنش حذف شد.' });
  } catch (err) {
    next(err);
  }
}
