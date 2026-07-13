import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SupportTicket, AuditLog } from '@/lib/models';
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
// GET: LIST ALL TICKETS IN THE SYSTEM
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const rawTickets = await SupportTicket.find().sort({ createdAt: -1 });
    const tickets = rawTickets.map((t: any) => ({
      id: t._id.toString(),
      studentId: t.studentId?.toString(),
      studentName: t.studentName,
      studentEmail: t.studentEmail,
      subject: t.subject,
      message: t.message,
      status: t.status,
      createdAt: t.createdAt,
      replies: t.replies.map((r: any) => ({
        sender: r.sender,
        message: r.message,
        date: r.date
      }))
    }));

    return NextResponse.json({
      success: true,
      message: 'Platform tickets retrieved successfully.',
      data: { tickets },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin GET Tickets Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve support tickets list.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// PUT: REPLY TO TICKET & MARK CLOSED
// ==========================================
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const { ticketId, replyMessage } = await req.json();

    if (!ticketId || !replyMessage) {
      return NextResponse.json({ success: false, message: 'Ticket ID and response body are required.', data: {}, errors: ['Missing fields'] }, { status: 400 });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Support ticket not found.', data: {}, errors: ['Ticket not found'] }, { status: 404 });
    }

    ticket.replies.push({
      sender: 'admin',
      message: replyMessage,
      date: new Date()
    });

    ticket.status = 'closed';
    await ticket.save();

    // Create Audit Log
    const audit = new AuditLog({
      user: admin.email,
      action: 'SUPPORT_TICKET_REPLY',
      details: `Replied and resolved ticket: ${ticketId}`,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Tutor reply successfully recorded and ticket closed.',
      data: {
        ticket: {
          id: ticket._id.toString(),
          studentId: ticket.studentId?.toString(),
          studentName: ticket.studentName,
          studentEmail: ticket.studentEmail,
          subject: ticket.subject,
          message: ticket.message,
          status: ticket.status,
          createdAt: ticket.createdAt,
          replies: ticket.replies.map((r: any) => ({
            sender: r.sender,
            message: r.message,
            date: r.date
          }))
        }
      },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin PUT Ticket Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to record support response.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
