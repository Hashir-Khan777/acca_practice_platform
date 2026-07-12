import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
      data: {},
      errors: []
    });

    // Clear HttpOnly secure cookies for access and refresh tokens
    response.cookies.set('acca_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('acca_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Logout API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to log out.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
