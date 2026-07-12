'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Badge } from '@/components/UI';
import { Announcement } from '@/lib/store';

export default function StudentNotificationsPage() {
  const { store, notifications } = useDashboard();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Announcements & Notifications</h2>
        <p className="text-xs text-slate-500">Official administration announcements and student milestone reminders.</p>
      </div>

      <div className="flex flex-col gap-4">
        {store.announcements.map((ann: Announcement) => (
          <Card key={ann.id} className="p-5 border-l-4 border-emerald-500 flex flex-col gap-2 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-500 uppercase tracking-widest font-mono">Platform Announcement</span>
              <span className="text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{ann.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ann.message}</p>
          </Card>
        ))}

        {notifications.map((note) => (
          <Card key={note.id} className="p-5 flex flex-col gap-1 text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-400">Milestone Reminder</span>
              <span className="text-slate-400">{note.date}</span>
            </div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-250">{note.title}</h3>
            <p className="text-xs text-slate-500">{note.desc}</p>
          </Card>
        ))}

        {store.announcements.length === 0 && notifications.length === 0 && (
          <p className="text-xs text-slate-400 italic text-center py-8">No announcements or alerts present in your feed.</p>
        )}
      </div>
    </motion.div>
  );
}
