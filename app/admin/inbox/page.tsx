'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card } from '@/components/UI';
import { Trash2 } from 'lucide-react';
import { ContactMessage } from '@/lib/store';

export default function AdminInboxPage() {
  const { store, updateStore, setSuccess } = useAdmin();

  const handleDeleteMessage = async (msgId: string) => {
    if (!store) return;
    try {
      const res = await fetch(`/api/admin/inbox?messageId=${msgId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedMessages = store.contactMessages.filter((m: any) => m.id !== msgId);
        
        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'CONTACT_MSG_DELETE', details: `Deleted public message: ${msgId}`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        const updated = { ...store, contactMessages: updatedMessages, auditLogs: updatedLogs };
        updateStore(updated);
        setSuccess('Inbox message permanently purged.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {}
  };

  const handleDeleteSubscriber = async (subId: string) => {
    if (!store) return;
    try {
      const res = await fetch(`/api/admin/inbox?subscriberId=${subId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedSubscribers = store.subscribers.filter((s: any) => s.id !== subId);
        
        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'SUBSCRIBER_DELETE', details: `Deleted newsletter subscriber: ${subId}`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        const updated = { ...store, subscribers: updatedSubscribers, auditLogs: updatedLogs };
        updateStore(updated);
        setSuccess('Newsletter subscriber permanently purged.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {}
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Public Inbox & Newsletters</h2>
        <p className="text-xs text-slate-500">Manage questions and newsletter subscriptions submitted via public portals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Visitor Messages */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Visitor Inquiries ({store.contactMessages.length})</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {store.contactMessages.map((msg: ContactMessage) => (
              <Card key={msg.id} className="p-5 flex flex-col gap-3 text-left relative overflow-hidden">
                <div className="flex justify-between items-start text-[10px] font-mono text-slate-400">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-255">{msg.name}</span>
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
        </div>

        {/* Newsletter Subscribers */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Subscribers ({store.subscribers?.length || 0})</span>
          <Card className="p-4 flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
              {(store.subscribers || []).map((sub: any) => (
                <div key={sub.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 text-xs">
                  <div className="flex flex-col gap-0.5 text-left truncate pr-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{sub.email}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(sub.subscribedAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubscriber(sub.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title="Remove Subscriber"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(store.subscribers || []).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-12">No subscribers registered.</p>
              )}
            </div>
          </Card>
        </div>

      </div>

    </motion.div>
  );
}
