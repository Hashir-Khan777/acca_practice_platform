import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email address is required.', data: {}, errors: ['Missing email'] }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
        data: {}
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const resetLink = `${protocol}://${host}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Accountly Password Reset Request',
      body: `Hi ${user.name},\n\nYou requested to reset your Accountly password. Please click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`
    });

    const audit = new AuditLog({
      user: user.email,
      action: 'FORGOT_PASSWORD',
      details: 'Requested password reset link.',
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      data: {}
    });

  } catch (error: any) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error while processing request.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
