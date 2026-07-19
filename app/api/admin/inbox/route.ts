import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ContactMessage, AuditLog, Subscriber } from '@/lib/models';
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
// GET: RETRIEVE LANDING CONTACT MESSAGES
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const rawMessages = await ContactMessage.find().sort({ createdAt: -1 });
    const messages = rawMessages.map((m: any) => ({
      id: m._id.toString(),
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      createdAt: m.createdAt,
      status: m.status
    }));

    const rawSubscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    const subscribers = rawSubscribers.map((s: any) => ({
      id: s._id.toString(),
      email: s.email,
      subscribedAt: s.subscribedAt
    }));

    return NextResponse.json({
      success: true,
      message: 'Inquiries list retrieved successfully.',
      data: { messages, subscribers },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin GET Inbox Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve inbox messages.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// DELETE: PURGE CONTACT MESSAGE
// ==========================================
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const subscriberId = searchParams.get('subscriberId');

    if (!messageId && !subscriberId) {
      return NextResponse.json({ success: false, message: 'Message ID or Subscriber ID is required.', data: {}, errors: ['Missing parameters'] }, { status: 400 });
    }

    if (subscriberId) {
      const matched = await Subscriber.findByIdAndDelete(subscriberId);
      if (!matched) {
        return NextResponse.json({ success: false, message: 'Subscriber not found.', data: {}, errors: ['Not found'] }, { status: 404 });
      }

      const audit = new AuditLog({
        user: admin.email,
        action: 'SUBSCRIBER_DELETE',
        details: `Purged newsletter subscriber: ${matched.email}.`,
        timestamp: new Date()
      });
      await audit.save();

      return NextResponse.json({
        success: true,
        message: 'Newsletter subscriber permanently purged.',
        data: {},
        errors: []
      });
    }

    if (messageId) {
      const matched = await ContactMessage.findByIdAndDelete(messageId);
      if (!matched) {
        return NextResponse.json({ success: false, message: 'Inquiry message not found.', data: {}, errors: ['Not found'] }, { status: 404 });
      }

      const audit = new AuditLog({
        user: admin.email,
        action: 'CONTACT_MSG_DELETE',
        details: `Purged inbox message ID ${messageId} from ${matched.name}.`,
        timestamp: new Date()
      });
      await audit.save();

      return NextResponse.json({
        success: true,
        message: 'Visitor inquiry message permanently purged.',
        data: {},
        errors: []
      });
    }

  } catch (error: any) {
    console.error('Admin DELETE Inbox Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to purge inbox message.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
