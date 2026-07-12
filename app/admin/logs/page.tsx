'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card } from '@/components/UI';
import { AuditLog } from '@/lib/store';

export default function AdminAuditLogsPage() {
  const { store } = useAdmin();

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Administrative Audit Logs</h2>
        <p className="text-xs text-slate-500 font-mono">ALL ACTIONS STAMPED SECURABLE BY UTC DATE</p>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-150 dark:border-slate-850">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 uppercase text-[10px] font-mono font-extrabold text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Actor</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-850/40">
            {store.auditLogs.map((log: AuditLog) => (
              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                <td className="px-6 py-4 font-mono font-extrabold text-orange-500">{log.action}</td>
                <td className="px-6 py-4 font-bold">{log.user}</td>
                <td className="px-6 py-4">{log.details}</td>
                <td className="px-6 py-4 text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {store.auditLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                  No audit logs recorded in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

    </motion.div>
  );
}
