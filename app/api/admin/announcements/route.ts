import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Announcement, AuditLog } from '@/lib/models';
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
// GET: RETRIEVE GLOBAL ANNOUNCEMENTS
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const announcements = await Announcement.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      message: 'Global announcements retrieved successfully.',
      data: { announcements },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin GET Announcements Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve announcements.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// POST: DISPATCH NEW ANNOUNCEMENT
// ==========================================
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const { title, message, targetAudience } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'Title and message details are required.', data: {}, errors: ['Missing fields'] }, { status: 400 });
    }

    const newAnn = new Announcement({
      title,
      message,
      targetAudience: targetAudience || 'all',
      scheduleDate: new Date(),
      createdAt: new Date()
    });

    await newAnn.save();

    // Create Audit Log
    const audit = new AuditLog({
      user: admin.email,
      action: 'ANNOUNCEMENT_CREATE',
      details: `Published Global Announcement Bulletin: "${title}"`,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Announcement bulletin successfully published to students.',
      data: { announcement: newAnn },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin POST Announcement Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to publish announcement bulletin.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
