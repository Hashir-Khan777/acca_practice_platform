'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card, Button, Badge } from '@/components/UI';
import { User } from '@/lib/store';

export default function AdminStudentsPage() {
  const { store, updateStore, setSuccess } = useAdmin();

  const handleTogglePlan = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'TOGGLE_PLAN'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const updatedStudent = result.data.student;
        const updatedUsers = store.users.map((u: any) => u.id === userId ? updatedStudent : u);
        
        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'STUDENT_PLAN_UPDATE', details: `Changed plan for ${updatedStudent.email} to ${updatedStudent.plan.toUpperCase()}`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        const updated = { ...store, users: updatedUsers, auditLogs: updatedLogs };
        updateStore(updated);
        setSuccess(`Successfully updated subscription plan to ${updatedStudent.plan.toUpperCase()}.`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {}
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'TOGGLE_STATUS'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const updatedStudent = result.data.student;
        const updatedUsers = store.users.map((u: any) => u.id === userId ? updatedStudent : u);

        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'STUDENT_STATUS_UPDATE', details: `Status for ${updatedStudent.email} changed to ${updatedStudent.status}`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        const updated = { ...store, users: updatedUsers, auditLogs: updatedLogs };
        updateStore(updated);
        setSuccess(`Student account has been ${updatedStudent.status}.`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Accounts Manager</h2>
        <p className="text-xs text-slate-500">Edit subscription levels, change plan tiers, or execute temporary suspensions.</p>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-150 dark:border-slate-850">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 uppercase text-[10px] font-mono font-extrabold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">ACCA Study Level</th>
                <th className="px-6 py-4">Subscription Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Quizzes Solved</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850/40">
              {store.users
                .filter((u: any) => u.role === 'student')
                .map((std: User) => (
                  <tr key={std.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={std.photo} alt="Student" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-900 dark:text-white">{std.name}</span>
                        <span className="text-[10px] text-slate-400">{std.email} ({std.country})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{std.accaLevel}</td>
                    <td className="px-6 py-4 font-mono font-extrabold">
                      <Badge variant={std.plan === 'premium' ? 'premium' : 'info'}>
                        {std.plan.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <Badge variant={std.status === 'active' ? 'success' : 'danger'}>
                        {std.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-extrabold text-slate-500">{std.totalQuizzes}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-[28px] py-0 font-extrabold text-[10px]"
                        onClick={() => handleTogglePlan(std.id)}
                      >
                        Toggle Tier
                      </Button>
                      <Button
                        variant={std.status === 'active' ? 'danger' : 'primary'}
                        size="sm"
                        className="h-[28px] py-0 font-extrabold text-[10px]"
                        onClick={() => handleToggleStatus(std.id)}
                      >
                        {std.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
