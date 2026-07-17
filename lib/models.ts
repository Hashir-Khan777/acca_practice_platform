import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// ==========================================
// 1. USER MODEL
// ==========================================
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'admin';
  plan: 'free' | 'premium';
  status: 'active' | 'suspended';
  country?: string;
  accaLevel?: string;
  photo?: string;
  createdAt: Date;
  lastLogin?: Date;
  totalQuizzes: number;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  country: { type: String },
  accaLevel: { type: String },
  photo: { type: String, default: 'https://picsum.photos/seed/student/200/200' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  totalQuizzes: { type: Number, default: 0 }
});

UserSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to verify password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

// ==========================================
// 2. SUBJECT MODEL
// ==========================================
export interface ISubject extends Document {
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

// ==========================================
// 3. TOPIC MODEL
// ==========================================
export interface ITopic extends Document {
  subjectId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const TopicSchema = new Schema<ITopic>({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

// ==========================================
// 4. QUESTION & QUIZ MODEL
// ==========================================
export interface IQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string[];
  explanation: string;
  type: 'MCQ' | 'Input' | 'Excel';
}

export interface IQuiz extends Document {
  title: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'MCQ' | 'Input' | 'Excel';
  questions: IQuestion[];
  generatedBy: 'AI' | 'Admin';
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  correct_answer: [{ type: String, required: true }],
  explanation: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'Input', 'Excel'] }
});

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  type: { type: String, enum: ['MCQ', 'Input', 'Excel'], required: true },
  questions: [QuestionSchema],
  generatedBy: { type: String, enum: ['AI', 'Admin'], default: 'AI' },
  createdAt: { type: Date, default: Date.now }
});

// ==========================================
// 5. ATTEMPT MODEL (QUIZ ATTEMPTS)
// ==========================================
export interface IAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  quizId: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  date: Date;
  score: number;
  totalQuestions: number;
  percentage: number;
  duration: number;
  answers: Map<string, string[]>;
  skipped: number;
  correct: number;
  wrong: number;
}

const AttemptSchema = new Schema<IAttempt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  date: { type: Date, default: Date.now },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  duration: { type: Number, required: true },
  answers: { type: Map, of: [String] },
  skipped: { type: Number, required: true },
  correct: { type: Number, required: true },
  wrong: { type: Number, required: true }
});

// ==========================================
// 6. DAILY STREAK MODEL
// ==========================================
export interface IDailyStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date | null;
}

const DailyStreakSchema = new Schema<IDailyStreak>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastPracticeDate: { type: Date, default: null }
});

// ==========================================
// 7. SUPPORT TICKET MODEL
// ==========================================
export interface ITicketReply {
  sender: 'student' | 'admin';
  message: string;
  date: Date;
}

export interface ISupportTicket extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  createdAt: Date;
  replies: ITicketReply[];
}

const TicketReplySchema = new Schema<ITicketReply>({
  sender: { type: String, enum: ['student', 'admin'], required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const SupportTicketSchema = new Schema<ISupportTicket>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'pending', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  replies: [TicketReplySchema]
});

// ==========================================
// 8. CONTACT MESSAGE MODEL
// ==========================================
export interface IContactMessage extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  status: 'unread' | 'read' | 'replied';
}

const ContactMessageSchema = new Schema<IContactMessage>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' }
});

// ==========================================
// 9. ANNOUNCEMENT MODEL
// ==========================================
export interface IAnnouncement extends Document {
  title: string;
  message: string;
  targetAudience: 'all' | 'premium' | 'free';
  scheduleDate: Date;
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetAudience: { type: String, enum: ['all', 'premium', 'free'], default: 'all' },
  scheduleDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// ==========================================
// 10. AUDIT LOG MODEL
// ==========================================
export interface IAuditLog extends Document {
  user: string;
  action: string;
  details: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// ==========================================
// 11. SETTINGS MODEL (GLOBAL CONFIGS)
// ==========================================
export interface ISettings extends Document {
  key: string;
  value: string;
}

const SettingsSchema = new Schema<ISettings>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

// Avoid OverwriteModelError on Hot-Reloads
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export const Topic = mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
export const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
export const Attempt = mongoose.models.Attempt || mongoose.model<IAttempt>('Attempt', AttemptSchema);
export const DailyStreak = mongoose.models.DailyStreak || mongoose.model<IDailyStreak>('DailyStreak', DailyStreakSchema);
export const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export const ContactMessage = mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
export const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
