import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuditLog } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';

async function checkAdmin(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') return null;
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
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
