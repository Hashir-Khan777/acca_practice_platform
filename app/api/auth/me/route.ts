import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'No authorization header provided.',
        data: {},
        errors: ['Unauthorized access']
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({
        success: false,
        message: 'Access token is invalid or has expired.',
        data: {},
        errors: ['Token expired']
      }, { status: 401 });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User account no longer exists.',
        data: {},
        errors: ['User not found']
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

    return NextResponse.json({
      success: true,
      message: 'User profile retrieved successfully.',
      data: {
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
    console.error('Auth Me API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve profile details.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
