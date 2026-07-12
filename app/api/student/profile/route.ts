import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    // Auth Check
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access', data: {}, errors: ['Invalid session'] }, { status: 401 });
    }

    const { name, email, country, accaLevel } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required fields.', data: {}, errors: ['Missing fields'] }, { status: 400 });
    }
    if (!user) {
      return NextResponse.json({ success: false, message: 'Account not found.', data: {}, errors: ['Not found'] }, { status: 404 });
    }

    // Check if email is already taken by another user
    const emailLower = email.toLowerCase();
    if (emailLower !== user.email) {
      const emailTaken = await User.findOne({ email: emailLower });
      if (emailTaken) {
        return NextResponse.json({ success: false, message: 'This email is already associated with another account.', data: {}, errors: ['Email taken'] }, { status: 400 });
      }
    }

    user.name = name;
    user.email = emailLower;
    user.country = country || '';
    user.accaLevel = accaLevel || '';
    await user.save();

    // Create Audit Log
    const audit = new AuditLog({
      user: user.email,
      action: 'PROFILE_UPDATE',
      details: 'Updated student profile information.',
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Profile details updated successfully.',
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
    console.error('Update Profile API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update profile.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
