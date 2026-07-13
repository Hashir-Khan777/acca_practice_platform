'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card, Button, Input, Badge } from '@/components/UI';
import { SupportTicket } from '@/lib/store';

export default function AdminTicketsPage() {
  const { store, updateStore, setSuccess } = useAdmin();

  // CRUD State: Reply to ticket
  const [replyTicketId, setReplyTicketId] = React.useState('');
  const [ticketReplyText, setTicketReplyText] = React.useState('');

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTicketId || !ticketReplyText || !store) return;

    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: replyTicketId,
          replyMessage: ticketReplyText
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const updatedTicket = result.data.ticket;
        const updatedTickets = store.tickets.map((t: any) =>
          t.id === replyTicketId ? updatedTicket : t
        );

        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'SUPPORT_TICKET_REPLY', details: `Replied and closed ticket: ${replyTicketId}`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        updateStore({ ...store, tickets: updatedTickets, auditLogs: updatedLogs });
        setReplyTicketId('');
        setTicketReplyText('');
        setSuccess('Ticket reply sent and marked as closed.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {}
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">SLA Support Tickets Box</h2>
        <p className="text-xs text-slate-500">Provide answers to student questions and close tickets immediately.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Tickets Inbox list */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Received Support Tickets</span>
          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            {store.tickets.map((tkt: SupportTicket) => (
              <Card
                key={tkt.id}
                onClick={() => {
                  if (tkt.status === 'closed') return;
                  setReplyTicketId(tkt.id);
                }}
                className={`p-5 text-left border cursor-pointer transition-all ${
                  replyTicketId === tkt.id
                    ? 'bg-orange-500/5 border-orange-500/40 shadow-sm'
                    : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                  <span>{tkt.id} • {tkt.studentName} ({tkt.studentEmail})</span>
                  <Badge variant={tkt.status === 'open' ? 'warning' : 'success'}>
                    {tkt.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{tkt.subject}</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tkt.message}</p>

                {tkt.replies && tkt.replies.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px]">
                    <span className="font-bold text-emerald-500">Tutor Reply History:</span>
                    <div className="flex flex-col gap-1.5 mt-1">
                      {tkt.replies.map((rep: any, rIdx: number) => (
                        <div key={rIdx} className="border-t border-slate-100 dark:border-slate-800 pt-1.5 first:border-0 first:pt-0">
                          <div className="flex justify-between text-[8px] text-slate-400">
                            <span className="uppercase font-bold">{rep.sender}</span>
                            <span>{new Date(rep.date).toLocaleDateString()}</span>
                          </div>
                          <p className="italic">{rep.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
            {store.tickets.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-12">No active support tickets registered in system.</p>
            )}
          </div>
        </div>

        {/* Reply panel */}
        <div className="lg:col-span-5">
          <Card className="p-6 text-left">
            <form onSubmit={handleReplyTicket} className="flex flex-col gap-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Send Tutor Reply</span>
              
              <Input
                label="Selected Ticket ID"
                value={replyTicketId}
                onChange={(e) => setReplyTicketId(e.target.value)}
                placeholder="Click a ticket on the left"
                required
                disabled
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Detailed Response</label>
                <textarea
                  rows={4}
                  placeholder="Compose professional tutor guideline..."
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs transition-all focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-slate-100"
                  required
                  disabled={!replyTicketId}
                />
              </div>

              <Button variant="primary" type="submit" size="sm" disabled={!replyTicketId}>
                Send Reply & Close Ticket
              </Button>
            </form>
          </Card>
        </div>

      </div>

    </motion.div>
  );
}
