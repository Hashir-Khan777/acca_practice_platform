'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card, Button, Input } from '@/components/UI';
import { Announcement } from '@/lib/store';

export default function AdminAnnouncementsPage() {
  const { store, updateStore, setSuccess } = useAdmin();

  // CRUD State: Create Announcement
  const [annTitle, setAnnTitle] = React.useState('');
  const [annMessage, setAnnMessage] = React.useState('');

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annMessage || !store) return;

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          targetAudience: 'all'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const newAnn = result.data.announcement;
        const updatedAnnouncements = [newAnn, ...store.announcements];
        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'ANNOUNCEMENT_CREATE', details: `Title: "${annTitle}"`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        updateStore({ ...store, announcements: updatedAnnouncements, auditLogs: updatedLogs });
        setAnnTitle('');
        setAnnMessage('');
        setSuccess('Global announcement dispatched to student portal notifications.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {}
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-lg">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Global Announcements</h2>
        <p className="text-xs text-slate-500">Issue official site bulletins visible immediately in student panels.</p>
      </div>

      <Card className="p-6 text-left">
        <form onSubmit={handleCreateAnnouncement} className="flex flex-col gap-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Compose Announcement Bulletin</span>
          
          <Input
            label="Bulletin Title"
            placeholder="e.g. Gemini 3.5 Upgrade Completed"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Detailed Message Body</label>
            <textarea
              rows={4}
              placeholder="Type details..."
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs transition-all focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <Button variant="primary" type="submit" size="sm" className="mt-2">
            Publish Bulletin Now
          </Button>
        </form>
      </Card>

    </motion.div>
  );
}
