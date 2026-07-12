'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Button, Select } from '@/components/UI';

export default function StudentSettingsPage() {
  const { store } = useDashboard();

  // Settings State
  const [settingLanguage, setSettingLanguage] = React.useState('en');
  const [settingEmailNotify, setSettingEmailNotify] = React.useState(true);
  const [settingPushNotify, setSettingPushNotify] = React.useState(true);
  const [settingSuccess, setSettingSuccess] = React.useState(false);

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingSuccess(true);
    setTimeout(() => setSettingSuccess(false), 3000);
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">SaaS Preferences & Settings</h2>
        <p className="text-xs text-slate-500">Manage notifications, interface language, and study schedules.</p>
      </div>

      {settingSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold">
          Preferences updated and synchronized successfully!
        </div>
      )}

      <form onSubmit={handleUpdateSettings} className="flex flex-col gap-5 text-left">
        <Select
          label="Platform Language"
          options={[
            { value: 'en', label: 'English (UK Standard)' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' }
          ]}
          value={settingLanguage}
          onChange={(e) => setSettingLanguage(e.target.value)}
        />

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold">Email Notifications</span>
              <span className="text-[10px] text-slate-400">Receive summaries of weak areas via email</span>
            </div>
            <input
              type="checkbox"
              checked={settingEmailNotify}
              onChange={(e) => setSettingEmailNotify(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold">Push Notifications</span>
              <span className="text-[10px] text-slate-400">Receive streak and practice reminders</span>
            </div>
            <input
              type="checkbox"
              checked={settingPushNotify}
              onChange={(e) => setSettingPushNotify(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="primary" type="submit">
            Save SaaS Preferences
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
