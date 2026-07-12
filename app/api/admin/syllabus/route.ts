import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Subject, Topic, AuditLog } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';

async function checkAdmin(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') return null;
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
}

// ==========================================
// GET: RETRIEVE SYLLABUS SUBJECTS & TOPICS
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    // Retrieve all active subjects
    const subjects = await Subject.find().sort({ code: 1 });
    const topics = await Topic.find().sort({ name: 1 });

    return NextResponse.json({
      success: true,
      message: 'Syllabus registry retrieved successfully.',
      data: { subjects, topics },
      errors: []
    });

  } catch (error: any) {
    console.error('Admin GET Syllabus Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch syllabus data.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// POST: CREATE SUBJECT OR SYLLABUS TOPIC
// ==========================================
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const admin = await checkAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin role required.', data: {}, errors: ['Forbidden'] }, { status: 403 });
    }

    const body = await req.json();
    const { type, code, name, description, subjectId, difficulty } = body;

    if (type === 'SUBJECT') {
      if (!code || !name || !description) {
        return NextResponse.json({ success: false, message: 'Missing subject code, name, or description.', data: {}, errors: ['Missing fields'] }, { status: 400 });
      }

      const upperCode = code.toUpperCase();
      const subjectExists = await Subject.findOne({ code: upperCode });
      if (subjectExists) {
        return NextResponse.json({ success: false, message: 'A course subject already exists with this code.', data: {}, errors: ['Subject exists'] }, { status: 400 });
      }

      const newSubject = new Subject({
        code: upperCode,
        name,
        description,
        status: 'active'
      });
      await newSubject.save();

      // Audit Log
      const audit = new AuditLog({
        user: admin.email,
        action: 'SUBJECT_ADD',
        details: `Registered Subject ${upperCode}: ${name}`,
        timestamp: new Date()
      });
      await audit.save();

      return NextResponse.json({
        success: true,
        message: 'New Subject registered successfully.',
        data: { subject: newSubject },
        errors: []
      });

    } else if (type === 'TOPIC') {
      if (!subjectId || !name || !description) {
        return NextResponse.json({ success: false, message: 'Missing subject ID, topic name, or description.', data: {}, errors: ['Missing fields'] }, { status: 400 });
      }

      const newTopic = new Topic({
        subjectId,
        name,
        description,
        difficulty: difficulty || 'medium'
      });
      await newTopic.save();

      // Audit Log
      const audit = new AuditLog({
        user: admin.email,
        action: 'TOPIC_ADD',
        details: `Registered Topic "${name}" under Subject ID ${subjectId}`,
        timestamp: new Date()
      });
      await audit.save();

      return NextResponse.json({
        success: true,
        message: 'New Topic registered successfully under Subject.',
        data: { topic: newTopic },
        errors: []
      });

    } else {
      return NextResponse.json({ success: false, message: 'Invalid entity type requested.', data: {}, errors: ['Invalid type'] }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Admin POST Syllabus Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to register syllabus entity.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
