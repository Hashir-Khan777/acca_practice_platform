'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Button } from '@/components/UI';
import { Sparkles } from 'lucide-react';

export default function StudentRecommendationsPage() {
  const router = useRouter();
  const { store } = useDashboard();

  const weakTopics = store.attempts
    .filter((a: any) => a.percentage < 70)
    .map((a: any) => a.topic);
  const uniqueWeakTopics = Array.from(new Set(weakTopics)).slice(0, 3) as string[];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Advisor & Learning Path</h2>
        <p className="text-xs text-slate-500">Tutor advisory panel summarizing customized next steps based on your quiz answering profiles.</p>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-left flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Your Active Study Plan</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Based on your previous Leases (IFRS 16) and Audit Framework scores, the system suggests a balanced mix of basic Knowledge and medium Skills practice. Concentrate on consolidating calculations.
          </p>
        </Card>

        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold mt-2">Recommended Practice Actions</h3>

        {uniqueWeakTopics.map((top: string, i: number) => (
          <Card key={i} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" hoverable>
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[9px] uppercase font-mono text-rose-500 font-extrabold">Weak Area Target Action</span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{top}</h4>
              <p className="text-[11px] text-slate-400 leading-normal">System suggests testing at Medium difficulty to boost score above 50% pass mark.</p>
            </div>

            <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/practice?topic=${encodeURIComponent(top)}`)}>
              Generate AI Quiz
            </Button>
          </Card>
        ))}

        {uniqueWeakTopics.length === 0 && (
          <p className="text-xs text-slate-400 italic">All subject profiles are in good standing! Select custom topics inside the Practice tab.</p>
        )}
      </div>
    </motion.div>
  );
}
