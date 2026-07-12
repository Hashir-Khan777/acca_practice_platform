import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { verifyRefreshToken, signAccessToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const refreshToken = req.cookies.get('acca_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        message: 'No refresh token provided.',
        data: {},
        errors: ['Unauthorized access']
      }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired session refresh token.',
        data: {},
        errors: ['Session expired']
      }, { status: 401 });
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.id);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Account no longer exists in system.',
        data: {},
        errors: ['Account not found']
      }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({
        success: false,
        message: 'Account has been suspended.',
        data: {},
        errors: ['Account suspended']
      }, { status: 403 });
    }

    // Generate new access token
    const newAccessToken = signAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        token: newAccessToken,
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

  } catch (error: any) {
    console.error('Refresh Token API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to refresh token.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}
