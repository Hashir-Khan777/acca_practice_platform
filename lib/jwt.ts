import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'acca_ai_practice_platform_super_secret_jwt_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'acca_ai_practice_platform_super_secret_refresh_key';

export function signAccessToken(payload: { id: string; email: string; role: 'student' | 'admin' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: { id: string; email: string; role: 'student' | 'admin' }) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): { id: string; email: string; role: 'student' | 'admin' } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: string; email: string; role: 'student' | 'admin' } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as any;
  } catch (e) {
    return null;
  }
}
