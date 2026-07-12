import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, DailyStreak, AuditLog } from '@/lib/models';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password, country, accaLevel } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, and password are required fields.',
        data: {},
        errors: ['Missing required fields']
      }, { status: 400 });
    }

    const emailLower = email.toLowerCase();
    const userExists = await User.findOne({ email: emailLower });
    if (userExists) {
      return NextResponse.json({
        success: false,
        message: 'An account is already registered with this email address.',
        data: {},
        errors: ['Email already in use']
      }, { status: 400 });
    }

    // Create the new User
    const newUser = new User({
      name,
      email: emailLower,
      passwordHash: password, // Mongoose pre-save hook will hash this
      role: 'student',
      plan: 'free',
      status: 'active',
      country: country || '',
      accaLevel: accaLevel || ''
    });

    await newUser.save();

    // Initialize the DailyStreak schema for this student
    const newStreak = new DailyStreak({
      userId: newUser._id,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null
    });
    await newStreak.save();

    // Create an audit log record
    const audit = new AuditLog({
      user: newUser.email,
      action: 'USER_REGISTER',
      details: 'Registered new student account.',
      timestamp: new Date()
    });
    await audit.save();

    // Generate tokens
    const userPayload = { id: newUser._id.toString(), email: newUser.email, role: newUser.role };
    const accessToken = signAccessToken(userPayload);
    const refreshToken = signRefreshToken(userPayload);

    // Return the response setting the secure refresh token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account successfully registered.',
      data: {
        token: accessToken,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          plan: newUser.plan,
          status: newUser.status,
          country: newUser.country,
          accaLevel: newUser.accaLevel,
          photo: newUser.photo,
          createdAt: newUser.createdAt,
          totalQuizzes: newUser.totalQuizzes
        }
      },
      errors: []
    });

    // Set HttpOnly secure cookie for refresh token
    response.cookies.set('acca_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error during registration.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
