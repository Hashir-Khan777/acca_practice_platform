import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Both email and password are required.',
        data: {},
        errors: ['Missing credentials']
      }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'No account found with this email address.',
        data: {},
        errors: ['Invalid email']
      }, { status: 400 });
    }

    // Verify status
    if (user.status === 'suspended') {
      return NextResponse.json({
        success: false,
        message: 'This account has been suspended by the administrator.',
        data: {},
        errors: ['Account suspended']
      }, { status: 403 });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({
        success: false,
        message: 'Invalid secure password. Please try again.',
        data: {},
        errors: ['Invalid password']
      }, { status: 400 });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create an audit log record
    const audit = new AuditLog({
      user: user.email,
      action: 'USER_LOGIN',
      details: `Successful login as ${user.role}.`,
      timestamp: new Date()
    });
    await audit.save();

    // Generate tokens
    const userPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccessToken(userPayload);
    const refreshToken = signRefreshToken(userPayload);

    // Return the response setting the secure refresh token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token: accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          status: user.status,
          country: user.country,
          accaLevel: user.accaLevel,
          photo: user.photo,
          createdAt: user.createdAt,
          totalQuizzes: user.totalQuizzes
        }
      },
      errors: []
    });

    // Set HttpOnly secure cookies for access and refresh tokens
    response.cookies.set('acca_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 24 * 60 * 60, // 1 day in seconds
      path: '/'
    });

    response.cookies.set('acca_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error during login.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
