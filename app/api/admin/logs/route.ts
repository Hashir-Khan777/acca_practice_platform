import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuditLog } from '@/lib/models';
import { verifyAccessToken } from '@/lib/jwt';

async function checkAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);
  if (!decoded || decoded.role !== 'admin') return null;
  return decoded;
}

// ==========================================
// GET: SYSTEM AUDIT LOGS
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);

    return NextResponse.json({
      success: true,
      message: 'System audit logs retrieved successfully.',
      data: { logs },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin GET Logs Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve system audit logs.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
