import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Attempt, User, DailyStreak, AuditLog } from '@/lib/models';
import { verifyAccessToken } from '@/lib/jwt';

// ==========================================
// GET: LIST ATTEMPTS WITH FILTERS & PAGINATION
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized access', data: {}, errors: ['Missing token'] }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token session.', data: {}, errors: ['Token expired'] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build DB Query
    const query: any = { userId: decoded.id };

    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    if (difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    // Execute queries
    const attempts = await Attempt.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attempt.countDocuments(query);

    return NextResponse.json({
      success: true,
      message: 'Attempts logs retrieved successfully.',
      data: {
        attempts,
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
    console.error('List Attempts API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve attempts list.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 500 });
  }
}

// ==========================================
// POST: RECORD NEW ATTEMPT & PROCESS STREAKS
// ==========================================
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized access', data: {}, errors: ['Missing token'] }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token session.', data: {}, errors: ['Token expired'] }, { status: 401 });
    }

    const body = await req.json();
    const { quizId, subject, topic, difficulty, score, totalQuestions, percentage, duration, answers, skipped, correct, wrong } = body;

    if (!quizId || !subject || !topic || score === undefined || !totalQuestions) {
      return NextResponse.json({ success: false, message: 'Missing required quiz metrics.', data: {}, errors: ['Missing fields'] }, { status: 400 });
    }

    // Save Attempt
    const newAttempt = new Attempt({
      userId: decoded.id,
      quizId,
      subject,
      topic,
      difficulty,
      score,
      totalQuestions,
      percentage,
      duration,
      answers,
      skipped,
      correct,
      wrong,
      date: new Date()
    });
    await newAttempt.save();

    // 1. Increment User solved counts
    const user = await User.findById(decoded.id);
    if (user) {
      user.totalQuizzes += 1;
      await user.save();
    }

    // 2. STREAKS UPDATER LOGIC
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let streak = await DailyStreak.findOne({ userId: decoded.id });
    if (!streak) {
      streak = new DailyStreak({
        userId: decoded.id,
        currentStreak: 1,
        longestStreak: 1,
        lastPracticeDate: now
      });
      await streak.save();
    } else {
      if (streak.lastPracticeDate) {
        const lastDate = new Date(streak.lastPracticeDate);
        const lastDateStr = lastDate.toISOString().split('T')[0];

        if (todayStr !== lastDateStr) {
          const diffTime = Math.abs(now.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 1) {
            streak.currentStreak += 1;
            if (streak.currentStreak > streak.longestStreak) {
              streak.longestStreak = streak.currentStreak;
            }
          } else {
            streak.currentStreak = 1;
          }
          streak.lastPracticeDate = now;
          await streak.save();
        }
      } else {
        streak.currentStreak = 1;
        streak.longestStreak = Math.max(streak.longestStreak, 1);
        streak.lastPracticeDate = now;
        await streak.save();
      }
    }

    // 3. Create Audit Log
    const audit = new AuditLog({
      user: decoded.email,
      action: 'QUIZ_SUBMIT',
      details: `Completed practice quiz on ${topic} with a score of ${percentage}%.`,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Attempt logged successfully.',
      data: {
        attempt: newAttempt,
        streak: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastPracticeDate: streak.lastPracticeDate
        }
      },
      errors: []
    });

  } catch (error: any) {
    console.error('Post Attempt API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to record attempt.',
      data: {},
      errors: [error.message || 'Unknown error occurred']
    }, { status: 550 });
  }
}
