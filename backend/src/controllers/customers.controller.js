const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const { rows } = await pool.query(
      `SELECT * FROM customers WHERE name ILIKE $1 OR company ILIKE $1 ORDER BY created_at DESC`,
      [search]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, email, phone, company, status } = req.body;
    if (!name) return res.status(400).json({ message: 'نام مشتری الزامی است.' });

    const { rows } = await pool.query(
      `INSERT INTO customers (name, email, phone, company, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, email || null, phone || null, company || null, status || 'active']
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, email, phone, company, status } = req.body;
    await pool.query(
      `UPDATE customers SET name=$1, email=$2, phone=$3, company=$4, status=$5 WHERE id=$6`,
      [name, email, phone, company, status, req.params.id]
    );
    res.json({ message: 'مشتری با موفقیت به‌روزرسانی شد.' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await pool.query(`DELETE FROM customers WHERE id=$1`, [req.params.id]);
    res.json({ message: 'مشتری حذف شد.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };