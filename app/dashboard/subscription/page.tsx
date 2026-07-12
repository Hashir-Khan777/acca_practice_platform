'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Button, Badge } from '@/components/UI';
import { Check, ShieldCheck, HelpCircle } from 'lucide-react';

export default function StudentSubscriptionPage() {
  const { store, setShowUpgradeModal } = useDashboard();

  if (!store) return null;

  const currentPlan = store.currentUser.plan || 'free';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-xl text-left">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Subscription & Billing</h2>
        <p className="text-xs text-slate-500">Manage plan levels, billing records, and feature access permissions.</p>
      </div>

      {/* Active Plan Widget */}
      <Card className="p-6 bg-slate-900 text-white border border-slate-800 rounded-3xl flex justify-between items-center">
        <div className="flex flex-col gap-1 text-left">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-extrabold">Active Status</span>
          <h3 className="font-extrabold text-base">
            {currentPlan === 'premium' ? 'Full-Pass Premium Plan' : 'Free Trial Starter'}
          </h3>
          <span className="text-xs text-slate-400">
            {currentPlan === 'premium' ? 'Renews automatically on Aug 11, 2026' : 'Limited daily generation capacity'}
          </span>
        </div>
        
        {currentPlan === 'free' ? (
          <Button variant="primary" size="sm" onClick={() => setShowUpgradeModal(true)}>
            Upgrade to Premium
          </Button>
        ) : (
          <Badge variant="success">Active</Badge>
        )}
      </Card>

      {/* Plan Features comparison */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold">Plan Privileges</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { text: 'Unlimited quiz generations', premiumOnly: true },
            { text: 'Full Applied Skills syllabus support', premiumOnly: true },
            { text: 'Detailed analytics report scorecards', premiumOnly: true },
            { text: 'Topic weakness detector path recommendations', premiumOnly: true },
            { text: '5 free basic quiz builds per day', premiumOnly: false },
            { text: 'Standard study streak tracking metrics', premiumOnly: false }
          ].map((feat, i) => (
            <div key={i} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-slate-700 dark:text-slate-300">{feat.text}</span>
                {feat.premiumOnly && <span className="text-[9px] text-emerald-500 font-extrabold uppercase font-mono">Premium Only</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Invoice history log */}
      <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold mt-2">Billing Invoice History</span>
      <Card className="p-0 overflow-hidden border border-slate-150 dark:border-slate-850">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/40 uppercase text-[10px] font-mono font-extrabold text-slate-400">
            <tr>
              <th className="px-5 py-3">Invoice ID</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-850/40">
            {currentPlan === 'premium' ? (
              <tr>
                <td className="px-5 py-3 font-bold">INV-9284</td>
                <td className="px-5 py-3">July 11, 2026</td>
                <td className="px-5 py-3">$19.00</td>
                <td className="px-5 py-3"><Badge variant="success">Paid</Badge></td>
              </tr>
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                  No active subscription billing logs.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </motion.div>
  );
}
