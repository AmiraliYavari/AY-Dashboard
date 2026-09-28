import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { Customer } from '../types/models';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const { rows } = await pool.query<Customer>(
      `SELECT * FROM customers WHERE name ILIKE $1 OR company ILIKE $1 ORDER BY created_at DESC`,
      [search]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, company, status } = req.body as Partial<Customer>;
    if (!name) {
      res.status(400).json({ message: 'نام مشتری الزامی است.' });
      return;
    }

    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO customers (name, email, phone, company, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, email || null, phone || null, company || null, status || 'active']
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, company, status } = req.body as Partial<Customer>;
    await pool.query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, company=$4, status=$5 WHERE id=$6`,
      [name, email, phone, company, status, req.params.id]
    );
    res.json({ message: 'مشتری با موفقیت به‌روزرسانی شد.' });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pool.query(`DELETE FROM customers WHERE id=$1`, [req.params.id]);
    res.json({ message: 'مشتری حذف شد.' });
  } catch (err) {
    next(err);
  }
}
