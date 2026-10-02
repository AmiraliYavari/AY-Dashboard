import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/models';

const DEFAULT_SECRET = 'change_this_secret';
const JWT_SECRET: string = process.env.JWT_SECRET || DEFAULT_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

if (JWT_SECRET === DEFAULT_SECRET || JWT_SECRET === 'replace_with_a_long_random_secret') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a long random value in production.');
  }
  console.warn('⚠️  JWT_SECRET is using a placeholder value. Set a strong secret in backend/.env before deploying.');
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
