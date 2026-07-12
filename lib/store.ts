'use client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  country?: string;
  accaLevel?: string;
  photo?: string;
  createdAt: string;
  plan: 'free' | 'premium';
  status: 'active' | 'suspended';
  lastLogin: string;
  totalQuizzes: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: string[]; // Support multi-select if needed, usually single string array
  explanation: string;
  type: 'single' | 'multiple' | 'input' | 'excel';
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'MCQ' | 'Input' | 'Excel';
  questions: Question[];
  createdAt: string;
  generatedBy: 'AI' | 'Admin';
}

export interface Attempt {
  id: string;
  quizId: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  date: string;
  score: number; // raw correct count
  totalQuestions: number;
  percentage: number;
  duration: number; // in seconds
  answers: { [questionId: number]: string[] }; // user answers
  skipped: number;
  correct: number;
  wrong: number;
  questions?: Question[];
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
}

export interface SupportTicket {
  id: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  createdAt: string;
  replies: { sender: 'student' | 'admin'; message: string; date: string }[];
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'premium' | 'free';
  scheduleDate: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
}

export function loadStore() {
  if (typeof window === 'undefined') return {
    currentUser: null,
    users: [],
    subjects: [],
    topics: [],
    attempts: [],
    streak: { currentStreak: 0, longestStreak: 0, lastPracticeDate: null },
    tickets: [],
    announcements: [],
    contactMessages: [],
    auditLogs: [],
    theme: 'light',
  };

  return {
    currentUser: null,
    users: [],
    subjects: [],
    topics: [],
    attempts: [],
    streak: { currentStreak: 0, longestStreak: 0, lastPracticeDate: null },
    tickets: [],
    announcements: [],
    contactMessages: [],
    auditLogs: [],
    theme: localStorage.getItem('acca_theme') || 'light',
  };
}

export function saveStore(storeData: any) {
  if (typeof window === 'undefined') return;
  if (storeData && storeData.theme) {
    localStorage.setItem('acca_theme', storeData.theme);
  }
}

// STREAK CALCULATION LOGIC
export function updateStreakOnPractice(streak: DailyStreak): DailyStreak {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  if (!streak.lastPracticeDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(streak.longestStreak, 1),
      lastPracticeDate: now.toISOString()
    };
  }

  const lastDate = new Date(streak.lastPracticeDate);
  const lastDateStr = lastDate.toISOString().split('T')[0];

  if (todayStr === lastDateStr) {
    // Already practiced today, keep streak the same
    return streak;
  }

  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    // Practiced on the consecutive day
    const nextStreak = streak.currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(streak.longestStreak, nextStreak),
      lastPracticeDate: now.toISOString()
    };
  } else {
    // Missed a day, reset current streak to 1
    return {
      currentStreak: 1,
      longestStreak: streak.longestStreak,
      lastPracticeDate: now.toISOString()
    };
  }
}
