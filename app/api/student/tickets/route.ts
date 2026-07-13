import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SupportTicket, User, AuditLog } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';

// ==========================================
// GET: FETCH STUDENT'S TICKETS
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Auth Check
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access', data: {}, errors: ['Invalid session'] }, { status: 401 });
    }

    const tickets = await SupportTicket.find({ studentId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      message: 'Tickets retrieved successfully.',
      data: { tickets },
      errors: []
    });

  } catch (error: any) {
    console.error('Get Tickets API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve support tickets.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// POST: SUBMIT NEW TICKET
// ==========================================
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Auth Check
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access', data: {}, errors: ['Invalid session'] }, { status: 401 });
    }

    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'Subject and message are required fields.', data: {}, errors: ['Missing fields'] }, { status: 400 });
    }

    const newTicket = new SupportTicket({
      studentId: user._id,
      studentName: user.name,
      studentEmail: user.email,
      subject,
      message,
      status: 'open',
      createdAt: new Date(),
      replies: []
    });

    await newTicket.save();

    // Create Audit Log
    const audit = new AuditLog({
      user: user.email,
      action: 'SUPPORT_TICKET_SUBMIT',
      details: `Submitted support ticket regarding: ${subject}`,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted successfully.',
      data: {
        ticket: {
          id: newTicket._id.toString(),
          studentId: newTicket.studentId.toString(),
          studentName: newTicket.studentName,
          studentEmail: newTicket.studentEmail,
          subject: newTicket.subject,
          message: newTicket.message,
          status: newTicket.status,
          createdAt: newTicket.createdAt,
          replies: []
        }
      },
      errors: []
    });

  } catch (error: any) {
    console.error('Submit Ticket API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit support ticket.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
