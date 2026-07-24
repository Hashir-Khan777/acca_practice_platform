import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { code } = body;
    let { email } = body;

    if (!code) {
      return NextResponse.json({ success: false, message: 'Verification code is required.', data: {}, errors: ['Missing code'] }, { status: 400 });
    }

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

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return NextResponse.json({ success: false, message: 'Invalid verification code.', data: {}, errors: ['Invalid code'] }, { status: 400 });
    }

    if (user.verificationExpires && new Date() > user.verificationExpires) {
      return NextResponse.json({ success: false, message: 'Verification code has expired. Please request a new one.', data: {}, errors: ['Code expired'] }, { status: 400 });
    }

    user.emailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const audit = new AuditLog({
      user: user.email,
      action: 'EMAIL_VERIFIED',
      details: 'Email successfully verified via 6-digit 2FA code.',
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      data: { verified: true }
    });

  } catch (error: any) {
    console.error('Verify Email API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error during verification.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
