import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    let { email } = body;

    let user = await getAuthUser(req);
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
      return NextResponse.json({ success: false, message: 'User account not found.', data: {}, errors: ['User not found'] }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email is already verified.', data: { verified: true } });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your new Accountly Verification Code',
      body: `Hi ${user.name},\n\nYour new 6-digit verification code is: ${verificationCode}\n\nThis code will expire in 1 hour.`
    });

    const audit = new AuditLog({
      user: user.email,
      action: 'RESEND_CODE',
      details: 'Requested new 2FA email verification code.',
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
      data: {}
    });

  } catch (error: any) {
    console.error('Resend Code API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error while resending verification code.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
