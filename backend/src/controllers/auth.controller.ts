import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { signToken } from '../utils/jwt';
import { User } from '../types/models';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ message: 'ایمیل و رمز عبور الزامی است.' });
      return;
    }

    const { rows } = await pool.query<User>('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ message: 'ایمیل یا رمز عبور نادرست است.' });
      return;
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

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rows } = await pool.query(
      'SELECT id, full_name AS name, email, role FROM users WHERE id = $1 LIMIT 1',
      [req.user?.id]
    );
    if (!rows[0]) {
      res.status(404).json({ message: 'کاربر یافت نشد.' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}
