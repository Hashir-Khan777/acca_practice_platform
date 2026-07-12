'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card } from '@/components/UI';
import { Trash2 } from 'lucide-react';
import { ContactMessage } from '@/lib/store';

export default function AdminInboxPage() {
  const { store, updateStore, setSuccess } = useAdmin();

  const handleDeleteMessage = (msgId: string) => {
    if (!store) return;
    const updatedMessages = store.contactMessages.filter((m: any) => m.id !== msgId);
    
    const updatedLogs = [
      { id: 'log-' + Date.now(), user: 'Admin', action: 'CONTACT_MSG_DELETE', details: `Deleted public message: ${msgId}`, timestamp: new Date().toISOString() },
      ...store.auditLogs
    ];

    const updated = { ...store, contactMessages: updatedMessages, auditLogs: updatedLogs };
    updateStore(updated);
    setSuccess('Inbox message permanently purged.');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Public Inquiries Inbox</h2>
        <p className="text-xs text-slate-500">Manage questions and quote requests submitted via the public contact forms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {store.contactMessages.map((msg: ContactMessage) => (
          <Card key={msg.id} className="p-5 flex flex-col gap-3 text-left relative overflow-hidden">
            <div className="flex justify-between items-start text-[10px] font-mono text-slate-400">
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 dark:text-slate-250">{msg.name}</span>
                <span>{msg.email} • {new Date(msg.createdAt).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => handleDeleteMessage(msg.id)}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <hr className="border-slate-50 dark:border-slate-850" />

            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-mono text-orange-500 font-extrabold">Inquiry Subject</span>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{msg.subject}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">{msg.message}</p>
            </div>
          </Card>
        ))}

        {store.contactMessages.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-12 md:col-span-2">No contact inquiries registered.</p>
        )}
      </div>

    </motion.div>
  );
}
