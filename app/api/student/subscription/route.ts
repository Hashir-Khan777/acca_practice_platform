import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || req.headers.get('cookie')?.split('acca_access_token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized credentials signature.' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Access forbidden. Student authorization required.' }, { status: 403 });
    }

    await connectDB();

    // Upgrade student plan in MongoDB Atlas
    const userDoc = await User.findOne({ email: decoded.email });
    if (!userDoc) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    userDoc.plan = 'premium';
    await userDoc.save();

    // Dispatch system audit log
    await AuditLog.create({
      user: userDoc.email,
      action: 'SUBSCRIPTION_UPGRADE',
      details: 'Upgraded subscription tier to premium',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription plan upgraded to premium successfully.',
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        plan: userDoc.plan
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal database signature error.' }, { status: 500 });
  }
}
