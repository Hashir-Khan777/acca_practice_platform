import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ContactMessage, AuditLog } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, subject, and message are required fields.',
        data: {},
        errors: ['Missing fields']
      }, { status: 400 });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email address provided.',
        data: {},
        errors: ['Invalid email']
      }, { status: 400 });
    }

    const newMessage = new ContactMessage({
      name,
      email: email.toLowerCase(),
      subject,
      message,
      createdAt: new Date(),
      status: 'unread'
    });

    await newMessage.save();

    // Register Audit Log
    const audit = new AuditLog({
      user: email.toLowerCase(),
      action: 'CONTACT_SUBMIT',
      details: `Submitted contact inquiry regarding: "${subject}"`,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Contact message successfully saved to database.',
      data: {
        message: {
          id: newMessage._id.toString(),
          name: newMessage.name,
          email: newMessage.email,
          subject: newMessage.subject,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
          status: newMessage.status
        }
      },
      errors: []
    });

  } catch (error: any) {
    console.error('Contact API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process contact message.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
