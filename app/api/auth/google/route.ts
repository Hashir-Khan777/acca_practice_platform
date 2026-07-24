import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, DailyStreak, AuditLog } from '@/lib/models';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { credential } = body;

    if (!credential) {
      return NextResponse.json({ success: false, message: 'Google credential token is required.', data: {}, errors: ['Missing credential'] }, { status: 400 });
    }

    // Verify Google ID token using Google Identity tokeninfo endpoint
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyRes.ok) {
      return NextResponse.json({ success: false, message: 'Google identity token verification failed.', data: {}, errors: ['Invalid token'] }, { status: 400 });
    }

    const verifyData = await verifyRes.json();
    if (!verifyData.email) {
      return NextResponse.json({ success: false, message: 'Invalid payload returned from Google authentication.', data: {}, errors: ['Invalid payload'] }, { status: 400 });
    }

    const email = verifyData.email.toLowerCase().trim();
    const name = verifyData.name || 'Google User';
    const picture = verifyData.picture || 'https://picsum.photos/seed/google/200/200';

    let user = await User.findOne({ email });

    if (!user) {
      // Create user if they don't exist
      const randomPassword = Math.random().toString(36) + Math.random().toString(36);
      user = new User({
        name,
        email,
        passwordHash: randomPassword, // Auto-hashed on save via UserSchema pre hook
        role: 'student',
        plan: 'free',
        status: 'active',
        photo: picture,
        emailVerified: true // Verified by Google OAuth
      });
      await user.save();

      // Initialize DailyStreak
      const newStreak = new DailyStreak({
        userId: user._id,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: null
      });
      await newStreak.save();

      const audit = new AuditLog({
        user: email,
        action: 'USER_REGISTER_GOOGLE',
        details: 'Registered new student account via Google Sign-In.',
        timestamp: new Date()
      });
      await audit.save();
    } else {
      // If user exists, verify status
      if (user.status === 'suspended') {
        return NextResponse.json({ success: false, message: 'This account has been suspended by the administrator.', data: {}, errors: ['Account suspended'] }, { status: 403 });
      }

      // Update emailVerified status if verified by Google
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }

      const audit = new AuditLog({
        user: email,
        action: 'USER_LOGIN_GOOGLE',
        details: 'Logged in successfully via Google Sign-In.',
        timestamp: new Date()
      });
      await audit.save();
    }

    // Set last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate session JWT tokens
    const userPayload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccessToken(userPayload);
    const refreshToken = signRefreshToken(userPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated via Google successfully.',
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
          totalQuizzes: user.totalQuizzes,
          emailVerified: user.emailVerified
        }
      },
      errors: []
    });

    // Set cookies
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
    console.error('Google Sign-In API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during Google Sign-In.', data: {}, errors: [error.message || 'Unknown error'] }, { status: 500 });
  }
}
