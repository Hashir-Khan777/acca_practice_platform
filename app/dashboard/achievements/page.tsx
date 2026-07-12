'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Progress, Badge } from '@/components/UI';

export default function StudentAchievementsPage() {
  const { store } = useDashboard();

  // Badge unlock rules evaluation
  const firstQuizUnlocked = store.attempts.length > 0;
  const sevenDayStreakUnlocked = store.streak.longestStreak >= 7;
  const topicMasterUnlocked = store.attempts.some((a: any) => a.percentage === 100);
  const fastLearnerUnlocked = store.attempts.some((a: any) => a.duration < 180);
  const syllabusExplorerUnlocked = React.useMemo(() => {
    const subjectsAttempted = new Set(store.attempts.map((a: any) => a.subject));
    return subjectsAttempted.size >= 3;
  }, [store.attempts]);
  const thirtyDayStreakUnlocked = store.streak.longestStreak >= 30;

  const badges = [
    { name: 'First Quiz', desc: 'Successfully submitted your first exam quiz.', icon: '🎓', unlocked: firstQuizUnlocked },
    { name: '7-Day Streak', desc: 'Maintain study practice for 7 days in a row.', icon: '🔥', unlocked: sevenDayStreakUnlocked },
    { name: 'Topic Master', desc: 'Achieve a 100% score on any Medium difficulty syllabus.', icon: '🌟', unlocked: topicMasterUnlocked },
    { name: 'Fast Learner', desc: 'Complete any 5-question test in under 3 minutes.', icon: '⚡', unlocked: fastLearnerUnlocked },
    { name: 'Syllabus Explorer', desc: 'Practice topics across three distinct course subjects.', icon: '🧭', unlocked: syllabusExplorerUnlocked },
    { name: '30-Day Streak', desc: 'Maintain practice for 30 consecutive days.', icon: '👑', unlocked: thirtyDayStreakUnlocked },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const completionPercentage = Math.round((unlockedCount / badges.length) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Achievements & Badges</h2>
        <p className="text-xs text-slate-500">Collect badges and track milestone parameters for active studying behavior.</p>
      </div>

      {/* Progress track */}
      <Card className="p-5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-extrabold">Badges Completion</span>
          <span>{unlockedCount} of {badges.length} Unlocked ({completionPercentage}%)</span>
        </div>
        <Progress value={completionPercentage} />
      </Card>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge, idx) => (
          <Card key={idx} className={`p-6 text-center flex flex-col items-center gap-3 border ${
            badge.unlocked ? 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800' : 'bg-slate-100/50 dark:bg-slate-950/20 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
          }`} hoverable={badge.unlocked}>
            <span className="text-3xl">{badge.icon}</span>
            <div className="flex flex-col">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{badge.name}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{badge.desc}</p>
            </div>
            <Badge variant={badge.unlocked ? 'success' : 'info'} className="mt-1">
              {badge.unlocked ? 'Unlocked' : 'Locked'}
            </Badge>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
