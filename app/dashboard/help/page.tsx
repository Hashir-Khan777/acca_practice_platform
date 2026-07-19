'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Button, Input, Badge } from '@/components/UI';
import { SupportTicket } from '@/lib/store';

export default function StudentHelpCenterPage() {
  const { store, updateStore } = useDashboard();

  // Support / Tickets Form State
  const [ticketSubject, setTicketSubject] = React.useState('');
  const [ticketMessage, setTicketMessage] = React.useState('');
  const [ticketSuccess, setTicketSuccess] = React.useState(false);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage || !store) return;

    try {
      const res = await fetch('/api/student/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const newTicket = result.data.ticket;
        const updatedTickets = [newTicket, ...store.tickets];
        setTicketSuccess(true);
        setTimeout(() => setTicketSuccess(false), 3000);
        setTicketSubject('');
        setTicketMessage('');
        // const updatedLogs = [
        //   { id: 'log-' + Date.now(), user: store.currentUser.email, action: 'SUPPORT_TICKET_CREATE', details: `Subject: "${ticketSubject}"`, timestamp: new Date().toISOString() },
        //   ...store.auditLogs
        // ];

        const updatedStore = {
          ...store,
          tickets: updatedTickets,
          // auditLogs: updatedLogs
        };

        updateStore(updatedStore);
      }
    } catch (err: any) {}
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Help Center & Support Desk</h2>
        <p className="text-xs text-slate-500">Contact tutor support, submit assistance tickets, or review platform guides.</p>
      </div>

      {ticketSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold">
          Support ticket submitted successfully! A study adviser will review it.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Submit Ticket Form */}
        <Card className="p-6">
          <form onSubmit={handleCreateTicket} className="flex flex-col gap-4 text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Submit Support Ticket</span>
            
            <Input
              label="Inquiry Subject"
              placeholder="e.g. IAS 16 Leases question error"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Detailed Message</label>
              <textarea
                rows={3}
                placeholder="Detail your question or system issues..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs transition-all focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <Button variant="primary" type="submit" size="sm" className="mt-2">
              Submit Ticket
            </Button>
          </form>
        </Card>

        {/* Tickets inbox */}
        <div className="flex flex-col gap-4 text-left">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Active Tickets Inbox</span>
          
          {store.tickets
            .filter((t: any) => t.studentEmail === store.currentUser.email)
            .map((t: SupportTicket) => (
              <Card key={t.id} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-mono font-bold text-slate-400">{t.id}</span>
                  <Badge variant={t.status === 'open' ? 'warning' : 'success'}>
                    {t.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{t.subject}</h4>
                <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{t.message}</p>
                
                {t.replies && t.replies.length > 0 && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-[10px]">
                    <span className="font-bold text-emerald-500">Tutor Response:</span>
                    <p className="italic text-slate-600 dark:text-slate-350">{t.replies[t.replies.length - 1].message}</p>
                  </div>
                )}
              </Card>
            ))}
            
          {store.tickets.filter((t: any) => t.studentEmail === store.currentUser.email).length === 0 && (
            <p className="text-xs text-slate-400 italic">No tickets in your inquiry inbox.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
