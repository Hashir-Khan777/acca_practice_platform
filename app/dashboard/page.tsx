'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useDashboard } from './context';
import { Card, Button, Badge } from '@/components/UI';
import {
  LayoutDashboard, BookOpen, BarChart3, Clock, Zap, Check, ArrowRight, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function StudentDashboardOverview() {
  const router = useRouter();
  const { store } = useDashboard();

  // Metrics calculations
  const totalSolved = store.attempts.reduce((acc: number, curr: any) => acc + curr.totalQuestions, 0);
  const correctCount = store.attempts.reduce((acc: number, curr: any) => acc + curr.correct, 0);
  const incorrectCount = store.attempts.reduce((acc: number, curr: any) => acc + curr.wrong, 0);
  const avgPerformanceScore = store.attempts.length > 0
    ? Math.round(store.attempts.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / store.attempts.length)
    : 0;

  // Weak topics detection
  const weakTopics = store.attempts
    .filter((a: any) => a.percentage < 70)
    .map((a: any) => a.topic);
  const uniqueWeakTopics = Array.from(new Set(weakTopics)).slice(0, 3) as string[];

  // Strong topics detection
  const strongTopics = store.attempts
    .filter((a: any) => a.percentage >= 80)
    .map((a: any) => a.topic);
  const uniqueStrongTopics = Array.from(new Set(strongTopics)).slice(0, 3) as string[];

  // Recharts assemblies
  const weeklyPracticeData = [
    { day: 'Mon', quizzes: 1 },
    { day: 'Tue', quizzes: 2 },
    { day: 'Wed', quizzes: 0 },
    { day: 'Thu', quizzes: 1 },
    { day: 'Fri', quizzes: store.attempts.length > 2 ? 2 : 1 },
    { day: 'Sat', quizzes: store.attempts.filter((a: any) => a.date.includes('07-11') || a.date.includes('today')).length },
    { day: 'Sun', quizzes: 0 }
  ];

  const subjectPerformanceData = store.subjects.map((sub: any) => {
    const subAttempts = store.attempts.filter((a: any) => a.subject === sub.name);
    const avgScore = subAttempts.length > 0
      ? Math.round(subAttempts.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / subAttempts.length)
      : 0;
    return { name: sub.code, score: avgScore };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      
      {/* Welcome header card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-in">
            Welcome back, {store.currentUser.name}!
          </h2>
          <p className="text-xs text-slate-500">
            Track your streaks, solve new ACCA quizzes, and monitor your weakness detection matrices.
          </p>
        </div>
        
        <Button size="sm" variant="primary" onClick={() => router.push('/dashboard/practice')}>
          New Quiz Generator <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      {/* OVERVIEW CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col gap-2 p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/10">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-amber-600">Daily Streak</span>
            <Zap className="w-4 h-4 text-amber-500 fill-current" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{store.streak.currentStreak} Days</span>
          <span className="text-[10px] text-slate-400">Longest Streak: {store.streak.longestStreak} days</span>
        </Card>

        <Card className="flex flex-col gap-2 p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/10">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-emerald-600">Total Solved</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{totalSolved} Questions</span>
          <span className="text-[10px] text-slate-400">In {store.attempts.length} practice sessions</span>
        </Card>

        <Card className="flex flex-col gap-2 p-5 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/10">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-blue-600">Average Score</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{avgPerformanceScore}%</span>
          <span className="text-[10px] text-slate-400">Syllabus Pass Threshold: 50%</span>
        </Card>

        <Card className="flex flex-col gap-2 p-5 bg-gradient-to-br from-purple-500/5 to-rose-500/5 border-purple-500/10">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-purple-600">Correct Answers</span>
            <Check className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{correctCount} / {totalSolved}</span>
          <span className="text-[10px] text-slate-400">Incorrect: {incorrectCount} (Need review)</span>
        </Card>
      </div>

      {/* RECHARTS ANALYTICS PLOTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly progress Bar */}
        <Card className="p-5 flex flex-col gap-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Weekly Practice Load</h3>
            <Badge variant="info">quizzes submitted</Badge>
          </div>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPracticeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="quizzes" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subject Performance Radar simulation */}
        <Card className="p-5 flex flex-col gap-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Subject Performance Score Card</h3>
            <Badge variant="premium">Average %</Badge>
          </div>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subjectPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* WEAK & STRONG AREAS WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak topics card */}
        <Card className="p-5 border-l-4 border-rose-500">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500 font-extrabold">Detected Weak Subjects (Need AI Quiz)</span>
            {uniqueWeakTopics.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {uniqueWeakTopics.map((top: string, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/10">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{top}</span>
                    <span className="text-[10px] font-bold text-rose-500 font-mono">Under 70% accuracy</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No weak areas registered yet. Keep practicing!</p>
            )}
          </div>
        </Card>

        {/* Strong topics card */}
        <Card className="p-5 border-l-4 border-emerald-500">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-extrabold">Topic Master Accolades (Strong Topics)</span>
            {uniqueStrongTopics.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {uniqueStrongTopics.map((top: string, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{top}</span>
                    <span className="text-[10px] font-bold text-emerald-500 font-mono">Over 80% accuracy</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Achieve an 80% score in any quiz to earn Master accolades here.</p>
            )}
          </div>
        </Card>
      </div>

      {/* RECENT ACTIVITY LOGS */}
      <Card className="p-5 flex flex-col gap-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Recent Activity History</span>
        <div className="flex flex-col gap-3">
          {store.attempts.slice(0, 3).map((att: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-xs py-2.5 border-b border-slate-50 dark:border-slate-850/40 last:border-0">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="font-extrabold text-slate-900 dark:text-white">{att.topic}</span>
                <span className="text-[10px] text-slate-400">{att.subject} • {att.difficulty.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-slate-500">{new Date(att.date).toLocaleDateString()}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${att.percentage >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {att.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </motion.div>
  );
}
