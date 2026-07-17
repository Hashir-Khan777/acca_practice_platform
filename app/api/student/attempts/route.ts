import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Attempt, User, DailyStreak, AuditLog, Quiz } from '@/lib/models';
import { getAuthUser } from '@/lib/jwt';

// ==========================================
// GET: LIST ATTEMPTS WITH FILTERS & PAGINATION
// ==========================================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Auth Check
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access', data: {}, errors: ['Invalid session'] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // 1. Direct query by attemptId
    const attemptId = searchParams.get('attemptId');
    if (attemptId) {
      const attempt = await Attempt.findOne({ _id: attemptId, userId: user._id });
      if (!attempt) {
        return NextResponse.json({ success: false, message: 'Attempt not found.', data: {}, errors: ['Not found'] }, { status: 404 });
      }
      let questions: any[] = [];
      if (attempt.quizId) {
        try {
          const quiz = await Quiz.findById(attempt.quizId);
          if (quiz) {
            questions = quiz.questions;
          }
        } catch (e) {}
      }
      return NextResponse.json({
        success: true,
        message: 'Attempt retrieved successfully.',
        data: {
          attempt: {
            id: attempt._id.toString(),
            userId: attempt.userId.toString(),
            quizId: attempt.quizId,
            subject: attempt.subject,
            topic: attempt.topic,
            difficulty: attempt.difficulty,
            date: attempt.date,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            percentage: attempt.percentage,
            duration: attempt.duration,
            answers: attempt.answers,
            skipped: attempt.skipped,
            correct: attempt.correct,
            wrong: attempt.wrong,
            questions
          }
        },
        errors: []
      });
    }

    // 2. Direct query by quizId (returns a blank/unanswered layout of the quiz)
    const quizId = searchParams.get('quizId');
    if (quizId) {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return NextResponse.json({ success: false, message: 'Quiz not found.', data: {}, errors: ['Not found'] }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: 'Quiz retrieved successfully.',
        data: {
          quiz: {
            id: quiz._id.toString(),
            title: quiz.title,
            subject: quiz.subject,
            topic: quiz.topic,
            difficulty: quiz.difficulty,
            type: quiz.type,
            questions: quiz.questions,
            createdAt: quiz.createdAt,
            generatedBy: quiz.generatedBy
          }
        },
        errors: []
      });
    }

    // 3. Paginated list
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const query: any = { userId: user._id };

    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    if (difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    const attempts = await Attempt.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attempt.countDocuments(query);

    const populatedAttempts = [];
    for (const attempt of attempts) {
      let questions: any[] = attempt.questions && attempt.questions.length > 0 ? attempt.questions : [];
      if (questions.length === 0 && attempt.quizId) {
        try {
          const quiz = await Quiz.findById(attempt.quizId);
          if (quiz) {
            const attemptAnswers = attempt.answers || new Map();
            questions = quiz.questions.map((q: any) => {
              let userAns = [];
              if (attemptAnswers.get) {
                userAns = attemptAnswers.get(q.id.toString()) || attemptAnswers.get(q.id) || [];
              } else {
                userAns = (attemptAnswers as any)[q.id.toString()] || (attemptAnswers as any)[q.id] || [];
              }
              const isCorrectQ = q.correct_answer.every((ans: string) => userAns.includes(ans)) && userAns.length === q.correct_answer.length;
              return {
                id: q.id,
                question: q.question,
                options: q.options,
                correct_answer: q.correct_answer,
                user_answer: userAns,
                is_correct: isCorrectQ,
                explanation: q.explanation,
                type: q.type || 'single'
              };
            });
          }
        } catch (e) {}
      }
      populatedAttempts.push({
        id: attempt._id.toString(),
        userId: attempt.userId.toString(),
        quizId: attempt.quizId,
        subject: attempt.subject,
        topic: attempt.topic,
        difficulty: attempt.difficulty,
        date: attempt.date,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        duration: attempt.duration,
        answers: attempt.answers,
        skipped: attempt.skipped,
        correct: attempt.correct,
        wrong: attempt.wrong,
        questions
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Attempts logs retrieved successfully.',
      data: {
        attempts: populatedAttempts,
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
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access', data: {}, errors: ['Invalid session'] }, { status: 401 });
    }

    const body = await req.json();
    const { quizId, subject, topic, difficulty, score, totalQuestions, percentage, duration, answers, skipped, correct, wrong } = body;

    if (!quizId || !subject || !topic || score === undefined || !totalQuestions) {
      return NextResponse.json({ success: false, message: 'Missing required quiz metrics.', data: {}, errors: ['Missing fields'] }, { status: 400 });
    }

    // Save Attempt
    const newAttempt = new Attempt({
      userId: user._id,
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
    user.totalQuizzes += 1;
    await user.save();

    // 2. STREAKS UPDATER LOGIC
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let streak = await DailyStreak.findOne({ userId: user._id });
    if (!streak) {
      streak = new DailyStreak({
        userId: user._id,
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
      user: user.email,
      action: 'QUIZ_SUBMIT',
      details: `Completed practice quiz on ${topic} with a score of ${percentage}%.`,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: 'Attempt logged successfully.',
      data: {
        attempt: {
          id: newAttempt._id.toString(),
          quizId: newAttempt.quizId,
          subject: newAttempt.subject,
          topic: newAttempt.topic,
          difficulty: newAttempt.difficulty,
          date: newAttempt.date,
          score: newAttempt.score,
          totalQuestions: newAttempt.totalQuestions,
          percentage: newAttempt.percentage,
          duration: newAttempt.duration,
          answers: newAttempt.answers,
          skipped: newAttempt.skipped,
          correct: newAttempt.correct,
          wrong: newAttempt.wrong
        },
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
