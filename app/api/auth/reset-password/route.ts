import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ success: false, message: 'Token and new password are required.', data: {}, errors: ['Missing fields'] }, { status: 400 });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Password reset token is invalid or has expired.', data: {}, errors: ['Invalid token'] }, { status: 400 });
    }

    user.passwordHash = password; // Hashed by Mongoose pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const audit = new AuditLog({
      user: user.email,
      action: 'PASSWORD_RESET',
      details: 'Password reset successfully using secure email token.',
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
      data: {}
    });

  } catch (error: any) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error while resetting password.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
