import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, AuditLog } from '@/lib/models';
import { verifyAccessToken } from '@/lib/jwt';

// Helper function to verify admin access
async function checkAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);
  if (!decoded || decoded.role !== 'admin') return null;
  return decoded;
}

// ==========================================
// GET: PAGINATED STUDENTS LIST
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const query: any = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (plan !== 'all') {
      query.plan = plan;
    }

    if (status !== 'all') {
      query.status = status;
    }

    const students = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return NextResponse.json({
      success: true,
      message: 'Student accounts retrieved successfully.',
      data: {
        students,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin GET Students Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch students list.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// PUT: TOGGLE USER PLAN OR SUSPENSION STATUS
// ==========================================
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const { userId, action, plan, status } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required.', data: {}, errors: ['Missing user ID'] }, { status: 400 });
    }

    const student = await User.findById(userId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Student account not found.', data: {}, errors: ['Student not found'] }, { status: 404 });
    }

    let auditDetails = '';

    if (action === 'TOGGLE_PLAN') {
      const nextPlan = student.plan === 'premium' ? 'free' : 'premium';
      student.plan = nextPlan;
      auditDetails = `Changed plan for ${student.email} to ${nextPlan.toUpperCase()}.`;
    } else if (action === 'SET_PLAN' && plan) {
      student.plan = plan;
      auditDetails = `Set plan for ${student.email} to ${plan.toUpperCase()}.`;
    } else if (action === 'TOGGLE_STATUS') {
      const nextStatus = student.status === 'active' ? 'suspended' : 'active';
      student.status = nextStatus;
      auditDetails = `Set suspension status for ${student.email} to ${nextStatus.toUpperCase()}.`;
    } else if (action === 'SET_STATUS' && status) {
      student.status = status;
      auditDetails = `Set status for ${student.email} to ${status.toUpperCase()}.`;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action provided.', data: {}, errors: ['Invalid action'] }, { status: 400 });
    }

    await student.save();

    // Create Audit Log
    const audit = new AuditLog({
      user: admin.email,
      action: 'ADMIN_STUDENT_UPDATE',
      details: auditDetails,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Student account status successfully updated.',
      data: {
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          role: student.role,
          plan: student.plan,
          status: student.status,
          country: student.country,
          accaLevel: student.accaLevel,
          totalQuizzes: student.totalQuizzes
        }
      },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin PUT Student Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update student status.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
