import jwt from 'jsonwebtoken';
import { User } from './models';
import { connectDB } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'acca_ai_practice_platform_super_secret_jwt_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'acca_ai_practice_platform_super_secret_refresh_key';

export function signAccessToken(payload: { id: string; email: string; role: 'student' | 'admin' }) {
  // Let access token last 1 day to make cookie sessions persistent and secure
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
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

export async function getAuthUser(req: any) {
  try {
    await connectDB();
    
    let token = '';
    
    // 1. Check Authorization header
    const authHeader = typeof req.headers.get === 'function' ? req.headers.get('authorization') : null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // 2. Check NextRequest cookies
      if (req.cookies && typeof req.cookies.get === 'function') {
        token = req.cookies.get('acca_access_token')?.value || '';
      }
      
      // 3. Fallback to parsing cookies header manually
      if (!token) {
        const cookieHeader = typeof req.headers.get === 'function' ? req.headers.get('cookie') : null;
        if (cookieHeader) {
          const match = cookieHeader.match(/acca_access_token=([^;]+)/);
          if (match) {
            token = match[1];
          }
        }
      }
    }
    
    if (!token) return null;
    
    const decoded = verifyAccessToken(token);
    if (!decoded) return null;
    
    const user = await User.findById(decoded.id);
    if (!user || user.status === 'suspended') return null;
    
    return user;
  } catch (error) {
    console.error('getAuthUser Error:', error);
    return null;
  }
}
