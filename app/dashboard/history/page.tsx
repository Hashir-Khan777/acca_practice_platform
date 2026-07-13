'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Button, Input, Select, Badge } from '@/components/UI';
import { Search } from 'lucide-react';

export default function StudentQuizHistoryPage() {
  const router = useRouter();
  const { store } = useDashboard();

  // History filtering states
  const [historySearch, setHistorySearch] = React.useState('');
  const [historyDifficultyFilter, setHistoryDifficultyFilter] = React.useState('all');

  // Filtered History
  const filteredHistory = store.attempts.filter((att: any) => {
    const matchesSearch = att.topic.toLowerCase().includes(historySearch.toLowerCase()) || att.subject.toLowerCase().includes(historySearch.toLowerCase());
    const matchesDifficulty = historyDifficultyFilter === 'all' || att.difficulty === historyDifficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Quiz Practice History</h2>
        <p className="text-xs text-slate-500">Filter, search, and audit your completed practice questions and scorecard logs.</p>
      </div>

      {/* Filtering bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Input
            placeholder="Search by topic or subject..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="pl-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-[14px]" />
        </div>

        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: 'all', label: 'All Difficulties' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' }
            ]}
            value={historyDifficultyFilter}
            onChange={(e) => setHistoryDifficultyFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table list */}
      <Card className="p-0 overflow-hidden border border-slate-150 dark:border-slate-850">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase text-[10px] font-mono font-extrabold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Topic</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Date Solved</th>
                <th className="px-6 py-4">Score Card</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850/40">
              {filteredHistory.map((att: any) => (
                <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{att.subject}</td>
                  <td className="px-6 py-4">{att.topic}</td>
                  <td className="px-6 py-4">
                    <Badge variant={att.difficulty === 'easy' ? 'info' : att.difficulty === 'medium' ? 'warning' : 'danger'}>
                      {att.difficulty}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{new Date(att.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                      att.percentage >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {att.score}/{att.totalQuestions} ({att.percentage}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-500 h-[28px] py-0 font-extrabold"
                      onClick={() => router.push(`/dashboard/history/analysis?attemptId=${att.id}`)}
                    >
                      View Analysis
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No quiz attempts match the active filtering filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
