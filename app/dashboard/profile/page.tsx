'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Card, Button, Input, Select } from '@/components/UI';
import { User } from '@/lib/store';

export default function StudentProfilePage() {
  const { store, updateStore } = useDashboard();

  // Profile Form State
  const [profileName, setProfileName] = React.useState('');
  const [profileEmail, setProfileEmail] = React.useState('');
  const [profileCountry, setProfileCountry] = React.useState('');
  const [profileLevel, setProfileLevel] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  const accaLevels = [
    { value: 'Foundation Diploma (FA1, FA2, MA1, MA2)', label: 'Foundation Diploma (FA1, FA2, MA1, MA2)' },
    { value: 'Applied Knowledge (BT, MA, FA)', label: 'Applied Knowledge (BT, MA, FA)' },
    { value: 'Applied Skills (LW, PM, TX, FR, AA, FM)', label: 'Applied Skills (LW, PM, TX, FR, AA, FM)' },
    { value: 'Strategic Professional (SBL, SBR)', label: 'Strategic Professional (SBL, SBR)' },
    { value: 'Strategic Professional Options (AFM, APM, ATX AAA)', label: 'Strategic Professional Options (AFM, APM, ATX AAA)' },
  ];

  React.useEffect(() => {
    if (store && store.currentUser) {
      setProfileName(store.currentUser.name);
      setProfileEmail(store.currentUser.email);
      setProfileCountry(store.currentUser.country || '');
      setProfileLevel(store.currentUser.accaLevel || '');
    }
  }, [store]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail || !store) return;

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          country: profileCountry,
          accaLevel: profileLevel
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const updatedUser = result.data.user;
        const updatedLogs = [
          { id: 'log-' + Date.now(), user: store.currentUser.email, action: 'PROFILE_UPDATE', details: 'Updated user personal details', timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        const updatedStore = {
          ...store,
          currentUser: updatedUser,
          auditLogs: updatedLogs
        };

        updateStore(updatedStore);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err: any) {}
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Profile</h2>
        <p className="text-xs text-slate-500">Edit your credentials, country parameters, and target ACCA study level.</p>
      </div>

      {profileSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold">
          Personal details updated and saved successfully!
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5 text-left">
        <div className="flex items-center gap-4">
          <img src={store.currentUser.photo} alt="Avatar" className="w-16 h-16 rounded-full border border-slate-200 object-cover" />
          <div className="flex flex-col">
            <span className="font-extrabold text-sm">{store.currentUser.name}</span>
            <span className="text-xs text-slate-400">Account Role: Student • {store.currentUser.plan.toUpperCase()}</span>
          </div>
        </div>

        <Input
          label="Name"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={profileEmail}
          onChange={(e) => setProfileEmail(e.target.value)}
          required
        />

        <Input
          label="Country of Residence"
          value={profileCountry}
          onChange={(e) => setProfileCountry(e.target.value)}
        />

        <Select
          label="Target ACCA Study Level"
          options={accaLevels}
          value={profileLevel}
          onChange={(e) => setProfileLevel(e.target.value)}
        />

        <Input
          label="Target ACCA Study Level"
          value={profileLevel}
          onChange={(e) => setProfileLevel(e.target.value)}
        />

        <div className="mt-2 flex justify-end">
          <Button variant="primary" type="submit">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
