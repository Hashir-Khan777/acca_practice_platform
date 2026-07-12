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

// Pre-populated default ACCA Subjects & Topics
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-fr', name: 'Financial Reporting', code: 'FR', description: 'Prepare, analyze, and interpret financial statements under IFRS.', status: 'active' },
  { id: 'sub-aa', name: 'Audit and Assurance', code: 'AA', description: 'Understand professional audit engagements and internal control frameworks.', status: 'active' },
  { id: 'sub-pm', name: 'Performance Management', code: 'PM', description: 'Apply management accounting techniques for quantitative and qualitative planning.', status: 'active' },
  { id: 'sub-fm', name: 'Financial Management', code: 'FM', description: 'Develop corporate finance, investment appraisal, and working capital skills.', status: 'active' },
];

const DEFAULT_TOPICS: Topic[] = [
  // FR Topics
  { id: 'top-fr-1', subjectId: 'sub-fr', name: 'Tangible Non-Current Assets (IAS 16)', description: 'Accounting for property, plant, and equipment valuation and depreciation.', difficulty: 'easy' },
  { id: 'top-fr-2', subjectId: 'sub-fr', name: 'Leases (IFRS 16)', description: 'Accounting treatment for right-of-use assets and lease liabilities.', difficulty: 'medium' },
  { id: 'top-fr-3', subjectId: 'sub-fr', name: 'Consolidated Financial Statements', description: 'Preparing group financial statements and goodwill calculations.', difficulty: 'hard' },
  // AA Topics
  { id: 'top-aa-1', subjectId: 'sub-aa', name: 'Audit Framework and Regulation', description: 'External audit vs internal audit, code of ethics, corporate governance.', difficulty: 'easy' },
  { id: 'top-aa-2', subjectId: 'sub-aa', name: 'Internal Control Systems', description: 'Assessing sales, purchases, and payroll system weaknesses and recommendations.', difficulty: 'medium' },
  { id: 'top-aa-3', subjectId: 'sub-aa', name: 'Substantive Audit Procedures', description: 'Gathering audit evidence for non-current assets, inventory, and receivables.', difficulty: 'hard' },
  // PM Topics
  { id: 'top-pm-1', subjectId: 'sub-pm', name: 'Activity-Based Costing (ABC)', description: 'Analyzing modern costing techniques compared to traditional absorption methods.', difficulty: 'easy' },
  { id: 'top-pm-2', subjectId: 'sub-pm', name: 'Transfer Pricing', description: 'Pricing strategies between divisions in a decentralized organization.', difficulty: 'medium' },
  { id: 'top-pm-3', subjectId: 'sub-pm', name: 'Linear Programming & Shadow Prices', description: 'Optimizing resource allocation with multiple binding constraints.', difficulty: 'hard' },
];

export const MOCK_AI_QUESTIONS: { [key: string]: Question[] } = {
  'sub-fr': [
    {
      id: 1,
      question: "Under IAS 16 Property, Plant and Equipment, which of the following is NOT a permissible element of cost for initial recognition?",
      options: [
        "Purchase price including import duties",
        "Initial estimate of dismantling and restoring costs",
        "Costs of advertising or promoting a new product",
        "Directly attributable costs of bringing the asset to working condition"
      ],
      correct_answer: ["Costs of advertising or promoting a new product"],
      explanation: "Under IAS 16, administrative and promotional overheads, including advertising costs, are explicitly excluded from cost capitalization and must be expensed as incurred.",
      type: "single"
    },
    {
      id: 2,
      question: "On 1 January 2026, Alpha Co leased a machine for 4 years with annual payments of $10,000 paid in arrears. The implicit rate is 10%. Alpha Co incurred $2,000 in initial direct costs. What is the initial value of the Right-of-Use (ROU) asset? (Cumulative discount factor for 4 years at 10% is 3.170)",
      options: [
        "$31,700",
        "$33,700",
        "$29,700",
        "$42,000"
      ],
      correct_answer: ["$33,700"],
      explanation: "Initial lease liability is the present value of payments: $10,000 * 3.170 = $31,700. Right-of-Use Asset includes the initial lease liability ($31,700) plus initial direct costs ($2,000) = $33,700.",
      type: "single"
    },
    {
      id: 3,
      question: "Which of the following describes the correct accounting treatment for an investment property under IAS 40 when using the fair value model?",
      options: [
        "Depreciate the asset and show fair value gains in Other Comprehensive Income (OCI)",
        "Do not depreciate the asset and show fair value changes in Profit or Loss (P&L)",
        "Depreciate the asset and show fair value changes in Profit or Loss (P&L)",
        "Do not depreciate the asset and show fair value changes in OCI"
      ],
      correct_answer: ["Do not depreciate the asset and show fair value changes in Profit or Loss (P&L)"],
      explanation: "Under IAS 40's fair value model, investment properties are not depreciated. Instead, they are revalued annually, and any changes in fair value are recognized in the Profit or Loss.",
      type: "single"
    }
  ],
  'sub-aa': [
    {
      id: 1,
      question: "Which of the following would represent an inherent risk factor at the financial statement level for a new audit engagement?",
      options: [
        "The client has a small internal audit team with limited scope.",
        "The client is seeking significant external funding linked to profitability targets.",
        "Inadequate physical protection over expensive raw material inventory.",
        "Reconciliations of the bank account are performed monthly instead of weekly."
      ],
      correct_answer: ["The client is seeking significant external funding linked to profitability targets."],
      explanation: "Significant funding targets create a high incentive for management bias and financial statement manipulation, which is an inherent risk factor at the financial statement level.",
      type: "single"
    },
    {
      id: 2,
      question: "During the audit of sales revenue, which substantive procedure would test for the assertion of COMPLETENESS?",
      options: [
        "Vouching a sample of sales transactions from the general ledger back to shipping documentation.",
        "Tracing a sample of shipping documentation (Goods Dispatch Notes) forward to the sales invoices and general ledger.",
        "Confirming outstanding receivables balances directly with customers via circularization.",
        "Reviewing credit notes issued in the post-year-end period to check for overstatement."
      ],
      correct_answer: ["Tracing a sample of shipping documentation (Goods Dispatch Notes) forward to the sales invoices and general ledger."],
      explanation: "Tracing forward from source documents (dispatch notes) to ledger entries ensures that all items shipped are completely recorded in the financial statements, verifying completeness.",
      type: "single"
    },
    {
      id: 3,
      question: "Which of the following threats to professional ethics arises when an audit firm performs valuation services for an audit client that directly affect the financial statement balances?",
      options: [
        "Familiarity threat",
        "Self-interest threat",
        "Self-review threat",
        "Advocacy threat"
      ],
      correct_answer: ["Self-review threat"],
      explanation: "Performing valuations that will be subsequently audited by the same firm creates a self-review threat, as the auditors would be evaluating their own work.",
      type: "single"
    }
  ]
};

const DEFAULT_USERS: User[] = [
  {
    id: 'user-student',
    name: 'Hashir Khan',
    email: 'hashirkhanacca2025@gmail.com',
    role: 'student',
    country: 'United Kingdom',
    accaLevel: 'Applied Skills (FR, AA, PM)',
    photo: 'https://picsum.photos/seed/student/200/200',
    createdAt: '2026-01-15T12:00:00Z',
    plan: 'free',
    status: 'active',
    lastLogin: '2026-07-11T12:00:00Z',
    totalQuizzes: 4
  },
  {
    id: 'user-admin',
    name: 'Admin Chief',
    email: 'admin@accapractice.ai',
    role: 'admin',
    createdAt: '2025-12-01T09:00:00Z',
    plan: 'premium',
    status: 'active',
    lastLogin: '2026-07-11T13:00:00Z',
    totalQuizzes: 0
  }
];

const DEFAULT_ATTEMPTS: Attempt[] = [
  {
    id: 'att-1',
    quizId: 'quiz-pre-1',
    subject: 'Financial Reporting',
    topic: 'Leases (IFRS 16)',
    difficulty: 'medium',
    date: '2026-07-10T14:30:00Z',
    score: 2,
    totalQuestions: 3,
    percentage: 67,
    duration: 180,
    answers: { 1: ["Costs of advertising or promoting a new product"], 2: ["$31,700"], 3: ["Do not depreciate the asset and show fair value changes in Profit or Loss (P&L)"] },
    skipped: 0,
    correct: 2,
    wrong: 1
  },
  {
    id: 'att-2',
    quizId: 'quiz-pre-2',
    subject: 'Audit and Assurance',
    topic: 'Audit Framework and Regulation',
    difficulty: 'easy',
    date: '2026-07-09T10:15:00Z',
    score: 3,
    totalQuestions: 3,
    percentage: 100,
    duration: 120,
    answers: { 1: ["The client is seeking significant external funding linked to profitability targets."], 2: ["Tracing a sample of shipping documentation (Goods Dispatch Notes) forward to the sales invoices and general ledger."], 3: ["Self-review threat"] },
    skipped: 0,
    correct: 3,
    wrong: 0
  }
];

const DEFAULT_STREAK: DailyStreak = {
  currentStreak: 2,
  longestStreak: 5,
  lastPracticeDate: '2026-07-10T14:30:00Z'
};

const DEFAULT_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    studentName: 'Hashir Khan',
    studentEmail: 'hashirkhanacca2025@gmail.com',
    subject: 'IFRS 16 Lease Formula clarification',
    message: 'Can you confirm if the Right of Use Asset should always equal the lease liability initial recognition value?',
    status: 'open',
    createdAt: '2026-07-10T15:00:00Z',
    replies: []
  },
  {
    id: 'tkt-2',
    studentName: 'Jane Watson',
    studentEmail: 'jane.w@acca.com',
    subject: 'Subscription upgrade issues',
    message: 'I upgraded to the premium subscription but my dashboard still says free tier.',
    status: 'closed',
    createdAt: '2026-07-08T09:00:00Z',
    replies: [
      { sender: 'admin', message: 'Hello Jane, we verified your payment and activated your Premium tier immediately. Let us know if you need anything else.', date: '2026-07-08T11:30:00Z' },
      { sender: 'student', message: 'Thank you, it works perfectly now!', date: '2026-07-08T12:00:00Z' }
    ]
  }
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'New ACCA Mock Exam Engine Released!',
    message: 'We have updated our practice engine to support both PDF summary exports and weak topic identification reports.',
    targetAudience: 'all',
    scheduleDate: '2026-07-11',
    createdAt: '2026-07-11T08:00:00Z'
  },
  {
    id: 'ann-2',
    title: 'Gemini 3.5 AI Enhancement',
    message: 'Quizzes are now generated using Gemini 3.5 Flash for much faster responses and exact ACCA syllabus mapping.',
    targetAudience: 'premium',
    scheduleDate: '2026-07-01',
    createdAt: '2026-07-01T10:00:00Z'
  }
];

const DEFAULT_CONTACT_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'Prof. Davis',
    email: 'davis@accatutors.com',
    subject: 'Institutional licensing options',
    message: 'We would love to buy 50 premium licenses for our revision class. Do you offer institutional discount packages?',
    createdAt: '2026-07-11T09:15:00Z',
    status: 'unread'
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', user: 'admin@accapractice.ai', action: 'LOGIN', details: 'Admin logged in from IP 192.168.1.50', timestamp: '2026-07-11T13:00:00Z' },
  { id: 'log-2', user: 'hashirkhanacca2025@gmail.com', action: 'QUIZ_GENERATE', details: 'Generated FR quiz under Leases topic', timestamp: '2026-07-10T14:25:00Z' }
];

export function loadStore() {
  if (typeof window === 'undefined') return {
    currentUser: DEFAULT_USERS[0],
    users: DEFAULT_USERS,
    subjects: DEFAULT_SUBJECTS,
    topics: DEFAULT_TOPICS,
    attempts: DEFAULT_ATTEMPTS,
    streak: DEFAULT_STREAK,
    tickets: DEFAULT_SUPPORT_TICKETS,
    announcements: DEFAULT_ANNOUNCEMENTS,
    contactMessages: DEFAULT_CONTACT_MESSAGES,
    auditLogs: DEFAULT_AUDIT_LOGS,
    theme: 'light',
  };

  const getOrSet = (key: string, defaultVal: any) => {
    const val = localStorage.getItem(key);
    if (val) {
      try { return JSON.parse(val); } catch(e) { return defaultVal; }
    }
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  };

  return {
    currentUser: getOrSet('acca_current_user', DEFAULT_USERS[0]),
    users: getOrSet('acca_users', DEFAULT_USERS),
    subjects: getOrSet('acca_subjects', DEFAULT_SUBJECTS),
    topics: getOrSet('acca_topics', DEFAULT_TOPICS),
    attempts: getOrSet('acca_attempts', DEFAULT_ATTEMPTS),
    streak: getOrSet('acca_streak', DEFAULT_STREAK),
    tickets: getOrSet('acca_tickets', DEFAULT_SUPPORT_TICKETS),
    announcements: getOrSet('acca_announcements', DEFAULT_ANNOUNCEMENTS),
    contactMessages: getOrSet('acca_contact_messages', DEFAULT_CONTACT_MESSAGES),
    auditLogs: getOrSet('acca_audit_logs', DEFAULT_AUDIT_LOGS),
    theme: localStorage.getItem('acca_theme') || 'light',
  };
}

export function saveStore(storeData: any) {
  if (typeof window === 'undefined') return;
  Object.keys(storeData).forEach(key => {
    if (key === 'theme') {
      localStorage.setItem('acca_theme', storeData[key]);
    } else {
      localStorage.setItem('acca_' + key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`), JSON.stringify(storeData[key]));
    }
  });
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
