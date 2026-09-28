const pool = require('../config/db');

// KPI summary cards: revenue, expenses, net profit, outstanding invoices
async function summary(req, res, next) {
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

// Monthly revenue vs. expense trend for the last 6 months
async function revenueTrend(req, res, next) {
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
    res.json(rows.map(r => ({ month: r.month, income: Number(r.income), expense: Number(r.expense) })));
  } catch (err) {
    next(err);
  }
}

// Breakdown of income by category (for a donut chart)
async function categoryBreakdown(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE type = 'income'
      GROUP BY category
      ORDER BY total DESC
      LIMIT 6
    `);
    res.json(rows.map(r => ({ category: r.category, total: Number(r.total) })));
  } catch (err) {
    next(err);
  }
}

async function recentTransactions(req, res, next) {
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

async function topCustomers(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.name, c.company, COALESCE(SUM(i.amount),0) AS total_billed
      FROM customers c
      LEFT JOIN invoices i ON i.customer_id = c.id AND i.status = 'paid'
      GROUP BY c.id
      ORDER BY total_billed DESC
      LIMIT 5
    `);
    res.json(rows.map(r => ({ ...r, total_billed: Number(r.total_billed) })));
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, revenueTrend, categoryBreakdown, recentTransactions, topCustomers };