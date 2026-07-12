'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from './context';
import { Card, Badge } from '@/components/UI';
import { AuditLog } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboardOverview() {
  const { store } = useAdmin();

  // Metrics calculations
  const studentsCount = store.users.filter((u: any) => u.role === 'student').length;
  const activeStreakUsers = store.users.filter((u: any) => u.role === 'student' && u.plan === 'premium').length;
  
  // Calculate trailing 7 days attempts dynamically
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - idx);
    const dateStr = d.toISOString().split('T')[0];
    const name = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      dateStr,
      name,
      attempts: 0
    };
  }).reverse();

  last7Days.forEach(day => {
    day.attempts = store.attempts.filter((a: any) => {
      try {
        const aDate = new Date(a.date).toISOString().split('T')[0];
        return aDate === day.dateStr;
      } catch (e) {
        return false;
      }
    }).length;
  });

  const dailyActivityData = last7Days.map(day => ({
    name: day.name,
    attempts: day.attempts
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Performance HQ</h2>
        <p className="text-xs text-slate-500 font-mono">LIVE API HANDSHAKES: ACTIVE • FIREBASE METRICS: GREEN</p>
      </div>

      {/* OVERVIEW CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Total Student Accounts</span>
          <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">{studentsCount} Students</span>
        </Card>

        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Premium Conversions</span>
          <span className="text-3xl font-extrabold font-mono text-orange-500">{activeStreakUsers} Premium</span>
        </Card>

        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Total Practice Attempts</span>
          <span className="text-3xl font-extrabold font-mono text-blue-500">{store.attempts.length} Solved</span>
        </Card>

        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Open Support Tickets</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-500">
            {store.tickets.filter((t: any) => t.status === 'open').length} Open
          </span>
        </Card>
      </div>

      {/* Weekly Practice chart and system logs split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly attempts tracker */}
        <Card className="p-5 flex flex-col gap-4 text-left">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold">Total Platform Practice Actions</span>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="attempts" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Audit Logs Quick view */}
        <Card className="p-5 flex flex-col gap-4 text-left">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold">Live Administrative System Activity</span>
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
            {store.auditLogs.slice(0, 5).map((log: AuditLog) => (
              <div key={log.id} className="text-xs py-2 border-b border-slate-50 dark:border-slate-900 last:border-0 text-left">
                <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-0.5">
                  <span>{log.user}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  <span className="text-orange-500 mr-1">{log.action}:</span> {log.details}
                </p>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </motion.div>
  );
}
