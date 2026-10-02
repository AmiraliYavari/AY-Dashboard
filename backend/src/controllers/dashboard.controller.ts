import { Request, Response, NextFunction } from 'express';
import pool from '../config/db';

export async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const revenueRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type = 'income'`
    );
    const expenseRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE type = 'expense'`
    );
    const outstandingRes = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
       FROM invoices WHERE status IN ('pending','overdue')`
    );
    const customerCountRes = await pool.query(
      `SELECT COUNT(*) AS total FROM customers WHERE status = 'active'`
    );

    const revenue = Number(revenueRes.rows[0].total);
    const expenses = Number(expenseRes.rows[0].total);

    res.json({
      revenue,
      expenses,
      netProfit: revenue - expenses,
      outstanding: {
        amount: Number(outstandingRes.rows[0].total),
        count: Number(outstandingRes.rows[0].count),
      },
      activeCustomers: Number(customerCountRes.rows[0].total),
    });
  } catch (err) {
    next(err);
  }
}

export async function revenueTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(`
      SELECT to_char(txn_date, 'YYYY-MM') AS month,
             SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
             SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE txn_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY to_char(txn_date, 'YYYY-MM')
      ORDER BY to_char(txn_date, 'YYYY-MM') ASC
    `);
    res.json(rows.map((r) => ({ month: r.month, income: Number(r.income), expense: Number(r.expense) })));
  } catch (err) {
    next(err);
  }
}

export async function categoryBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(`
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE type = 'income'
      GROUP BY category
      ORDER BY total DESC
      LIMIT 6
    `);
    res.json(rows.map((r) => ({ category: r.category, total: Number(r.total) })));
  } catch (err) {
    next(err);
  }
}

export async function recentTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(`
      SELECT t.id, t.type, t.category, t.amount, t.description, t.txn_date, c.name AS customer_name
      FROM transactions t
      LEFT JOIN customers c ON c.id = t.customer_id
      ORDER BY t.txn_date DESC, t.id DESC
      LIMIT 8
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function topCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.name, c.company, COALESCE(SUM(i.amount),0) AS total_billed
      FROM customers c
      LEFT JOIN invoices i ON i.customer_id = c.id AND i.status = 'paid'
      GROUP BY c.id
      ORDER BY total_billed DESC
      LIMIT 5
    `);
    res.json(rows.map((r) => ({ ...r, total_billed: Number(r.total_billed) })));
  } catch (err) {
    next(err);
  }
}

const CANDLE_WEEKS = 16;

function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Monday (UTC) of the week containing the given date. */
function weekStart(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7; // Monday = 0
  x.setUTCDate(x.getUTCDate() - dow);
  return x;
}

/**
 * Weekly "candles" of the running cash balance (income - expense).
 * open/close = balance at the start/end of the week, high/low = extremes of the daily balance.
 */
export async function cashflowCandles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const firstWeek = weekStart(now);
    firstWeek.setUTCDate(firstWeek.getUTCDate() - 7 * (CANDLE_WEEKS - 1));
    const from = isoDate(firstWeek);

    const openingRes = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
       FROM transactions WHERE txn_date < $1`,
      [from]
    );
    const dailyRes = await pool.query(
      `SELECT to_char(txn_date, 'YYYY-MM-DD') AS day,
              SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net,
              SUM(amount) AS volume
       FROM transactions WHERE txn_date >= $1
       GROUP BY txn_date ORDER BY txn_date ASC`,
      [from]
    );

    const daily = new Map<string, { net: number; volume: number }>();
    for (const r of dailyRes.rows) daily.set(r.day, { net: Number(r.net), volume: Number(r.volume) });

    let balance = Number(openingRes.rows[0].balance);
    const out: { week: string; open: number; high: number; low: number; close: number; volume: number }[] = [];

    for (let w = 0; w < CANDLE_WEEKS; w++) {
      const start = new Date(firstWeek);
      start.setUTCDate(start.getUTCDate() + 7 * w);
      const open = balance;
      let high = balance;
      let low = balance;
      let volume = 0;
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setUTCDate(day.getUTCDate() + d);
        const row = daily.get(isoDate(day));
        if (row) {
          balance += row.net;
          volume += row.volume;
          high = Math.max(high, balance);
          low = Math.min(low, balance);
        }
      }
      out.push({ week: isoDate(start), open, high, low, close: balance, volume });
    }
    res.json(out);
  } catch (err) {
    next(err);
  }
}

export async function invoiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
       FROM invoices GROUP BY status`
    );
    res.json(rows.map((r) => ({ status: r.status, count: Number(r.count), total: Number(r.total) })));
  } catch (err) {
    next(err);
  }
}
