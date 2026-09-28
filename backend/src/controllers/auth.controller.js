const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'ایمیل و رمز عبور الزامی است.' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ message: 'ایمیل یا رمز عبور نادرست است.' });
    }

    const token = signToken({ id: user.id, role: user.role, name: user.full_name });

    res.json({
      token,
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, full_name AS name, email, role FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'کاربر یافت نشد.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };