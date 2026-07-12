'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card, Button, Input, Select } from '@/components/UI';

export default function AdminSettingsPage() {
  const { store, setSuccess } = useAdmin();

  // CRUD State: System pricing and keys
  const [sysMonthlyPrice, setSysMonthlyPrice] = React.useState('19');
  const [sysAiThrottling, setSysAiThrottling] = React.useState('50');

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('Global system configurations successfully synchronized.');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-lg">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">HQ Global Configs</h2>
        <p className="text-xs text-slate-500">Configure public premium pricing plans, throttling parameters, and model aliases.</p>
      </div>

      <Card className="p-6 text-left">
        <form onSubmit={handleSaveSystemSettings} className="flex flex-col gap-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Core System Constants</span>
          
          <Input
            label="Premium Pricing Plan Monthly Fee ($)"
            value={sysMonthlyPrice}
            onChange={(e) => setSysMonthlyPrice(e.target.value)}
            required
          />

          <Input
            label="Gemini API Throttle Limit (Requests / min)"
            value={sysAiThrottling}
            onChange={(e) => setSysAiThrottling(e.target.value)}
            required
          />

          <Select
            label="Active LLM Architecture Target"
            options={[
              { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Production Default)' },
              { value: 'gemini-3.5-pro', label: 'Gemini 3.5 Pro (Enterprise Reasoning)' }
            ]}
            value="gemini-3.5-flash"
            onChange={() => {}}
          />

          <Button variant="primary" type="submit" size="sm" className="mt-2">
            Save HQ Configs
          </Button>
        </form>
      </Card>

    </motion.div>
  );
}
