'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Progress, Badge } from '@/components/UI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentAnalyticsPage() {
  const { store } = useDashboard();

  // Metrics calculations
  const avgPerformanceScore = store.attempts.length > 0
    ? Math.round(store.attempts.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / store.attempts.length)
    : 0;

  const avgSpeed = store.attempts.length > 0
    ? `${Math.round(store.attempts.reduce((acc: number, curr: any) => acc + curr.duration, 0) / store.attempts.length)}s`
    : '0s';

  const passRate = store.attempts.length > 0
    ? `${Math.round((store.attempts.filter((a: any) => a.percentage >= 50).length / store.attempts.length) * 100)}%`
    : '0%';

  const monthlyTrendData = store.attempts
    .slice()
    .reverse()
    .map((a: any, idx: number) => ({ name: `Attempt ${idx + 1}`, score: a.percentage }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Performance Analytics</h2>
        <p className="text-xs text-slate-500">Trace your historical performance trends, exam pass rates, and answering accuracy matrices.</p>
      </div>

      {/* High-level score grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Overall Accuracy rating</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-500">{avgPerformanceScore}%</span>
          <Progress value={avgPerformanceScore} className="mt-2" />
        </Card>

        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Answering Speed</span>
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{avgSpeed}</span>
          <span className="text-slate-400 text-[10px] mt-2">Average response duration per quiz</span>
        </Card>

        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Syllabus Pass Rate</span>
          <span className="text-3xl font-extrabold font-mono text-blue-500">{passRate}</span>
          <span className="text-slate-400 text-[10px] mt-2">Syllabus pass benchmarks exceeded</span>
        </Card>
      </div>

      {/* Monthly progress chart */}
      <Card className="p-5 flex flex-col gap-4 text-left">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold">Monthly Score Trend (Historical Attempts)</span>
        <div className="h-64 w-full text-xs">
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 italic">
              No historical data available. Complete some quizzes to populate chart records.
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
