import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';
import { Invoice } from '../types/models';
import { cleanText, isIsoDate, toId, toPositiveNumber } from '../utils/validate';

const STATUSES = ['paid', 'pending', 'overdue'];

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    let sql = `
      SELECT i.*, c.name AS customer_name
      FROM invoices i JOIN customers c ON c.id = i.customer_id
    `;
    const params: string[] = [];
    if (status) {
      if (!STATUSES.includes(status)) {
        res.status(400).json({ message: 'وضعیت فاکتور نامعتبر است.' });
        return;
      }
      params.push(status);
      sql += ` WHERE i.status = $${params.length}`;
    }
    sql += ' ORDER BY i.issue_date DESC, i.id DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Partial<Invoice>;
    const invoiceNo = cleanText(body.invoice_no);
    const customerId = toId(body.customer_id);
    const amount = toPositiveNumber(body.amount);
    const status = body.status ?? 'pending';

    if (!invoiceNo || !customerId || !amount || !isIsoDate(body.issue_date) || !isIsoDate(body.due_date)) {
      res.status(400).json({ message: 'همه فیلدهای فاکتور (با مقادیر معتبر) الزامی است.' });
      return;
    }
    if (!STATUSES.includes(status)) {
      res.status(400).json({ message: 'وضعیت فاکتور نامعتبر است.' });
      return;
    }
    if (body.due_date < body.issue_date) {
      res.status(400).json({ message: 'تاریخ سررسید نمی‌تواند قبل از تاریخ صدور باشد.' });
      return;
    }

    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO invoices (invoice_no, customer_id, amount, status, issue_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [invoiceNo, customerId, amount, status, body.issue_date, body.due_date]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toId(req.params.id);
    const { status } = req.body as { status?: string };
    if (!id) {
      res.status(400).json({ message: 'شناسه فاکتور نامعتبر است.' });
      return;
    }
    if (!status || !STATUSES.includes(status)) {
      res.status(400).json({ message: 'وضعیت فاکتور نامعتبر است.' });
      return;
    }
    const result = await pool.query(`UPDATE invoices SET status=$1 WHERE id=$2`, [status, id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'فاکتور یافت نشد.' });
      return;
    }
    res.json({ message: 'وضعیت فاکتور به‌روزرسانی شد.' });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = toId(req.params.id);
    if (!id) {
      res.status(400).json({ message: 'شناسه فاکتور نامعتبر است.' });
      return;
    }
    const result = await pool.query(`DELETE FROM invoices WHERE id=$1`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: 'فاکتور یافت نشد.' });
      return;
    }
    res.json({ message: 'فاکتور حذف شد.' });
  } catch (err) {
    next(err);
  }
}
