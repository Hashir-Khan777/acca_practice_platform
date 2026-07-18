'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Input, Select, Badge } from '@/components/UI';
import { loadStore, saveStore, User } from '@/lib/store';
import { UserPlus, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({ name: '', email: '', country: 'United Kingdom', accaLevel: 'Foundation Diploma (FA1, FA2, MA1, MA2)', password: '' });
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const accaLevels = [
    { value: 'Foundation Diploma (FA1, FA2, MA1, MA2)', label: 'Foundation Diploma (FA1, FA2, MA1, MA2)' },
    { value: 'Applied Knowledge (BT, MA, FA)', label: 'Applied Knowledge (BT, MA, FA)' },
    { value: 'Applied Skills (LW, PM, TX, FR, AA, FM)', label: 'Applied Skills (LW, PM, TX, FR, AA, FM)' },
    { value: 'Strategic Professional (SBL, SBR)', label: 'Strategic Professional (SBL, SBR)' },
    { value: 'Strategic Professional Options (AFM, APM, ATX AAA)', label: 'Strategic Professional Options (AFM, APM, ATX AAA)' },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          country: form.country,
          accaLevel: form.accaLevel
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setIsSubmitting(false);
        setIsSuccess(true);
        return;
      } else {
        setError(result.message || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Internal connection error. Database is not reachable.');
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <section className="py-16 sm:py-24 px-4 bg-slate-50/50 dark:bg-slate-900/10 flex-grow flex items-center justify-center">
        <div className="w-full max-w-md flex flex-col gap-6">
          <Card className="p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-md text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />

            <div className="flex flex-col gap-5">
              <div className="text-center flex flex-col gap-1">
                <Badge variant="premium" className="mx-auto">Free Student Signup</Badge>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Create Study Account
                </h2>
                <p className="text-xs text-slate-500">Access your personalized practicing environment in 60 seconds.</p>
              </div>

              <hr className="border-slate-50 dark:border-slate-900" />

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col items-center gap-3 text-center"
                >
                  <div className="p-2 bg-emerald-500 text-white rounded-full">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Profile Activated</h4>
                  <p className="text-xs text-slate-500">
                    Your profile has been registered and initialized. Redirecting to your personalized study workspace...
                  </p>
                  {setTimeout(() => router.push('/dashboard'), 1500) && null}
                </motion.div>
              ) : (
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Jhon Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Active Email Address"
                    type="email"
                    placeholder="e.g. example@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />

                  <Input
                    label="Country of Residence"
                    placeholder="e.g. United Kingdom"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />

                  <Select
                    label="ACCA Study Level"
                    options={accaLevels}
                    value={form.accaLevel}
                    onChange={(e) => setForm({ ...form, accaLevel: e.target.value })}
                  />

                  <Input
                    label="Choose Password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />

                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" id="accept_terms" required className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 w-4 h-4" />
                    <label htmlFor="accept_terms" className="text-[11px] text-slate-400">
                      I agree to the platform&apos;s <span onClick={() => router.push('/terms')} className="text-emerald-500 cursor-pointer hover:underline">Terms</span> & <span onClick={() => router.push('/privacy')} className="text-emerald-500 cursor-pointer hover:underline">Privacy Policies</span>.
                    </label>
                  </div>

                  <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full mt-2">
                    Register Profile <UserPlus className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              )}

              <hr className="border-slate-50 dark:border-slate-900" />

              <div className="text-center">
                <span className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <span
                    onClick={() => router.push('/login')}
                    className="text-emerald-500 font-bold hover:underline cursor-pointer"
                  >
                    Log In
                  </span>
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </PageWrapper>
  );
}
