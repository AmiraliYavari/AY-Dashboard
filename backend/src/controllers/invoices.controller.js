const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const status = req.query.status;
    let sql = `
      SELECT i.*, c.name AS customer_name
      FROM invoices i JOIN customers c ON c.id = i.customer_id
    `;
    const params = [];
    if (status) {
      params.push(status);
      sql += ` WHERE i.status = $${params.length}`;
    }
    sql += ' ORDER BY i.issue_date DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { invoice_no, customer_id, amount, status, issue_date, due_date } = req.body;
    if (!invoice_no || !customer_id || !amount || !issue_date || !due_date) {
      return res.status(400).json({ message: 'همه فیلدهای فاکتور الزامی است.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO invoices (invoice_no, customer_id, amount, status, issue_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [invoice_no, customer_id, amount, status || 'pending', issue_date, due_date]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    await pool.query(`UPDATE invoices SET status=$1 WHERE id=$2`, [status, req.params.id]);
    res.json({ message: 'وضعیت فاکتور به‌روزرسانی شد.' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await pool.query(`DELETE FROM invoices WHERE id=$1`, [req.params.id]);
    res.json({ message: 'فاکتور حذف شد.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, updateStatus, remove };