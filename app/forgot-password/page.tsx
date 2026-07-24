'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Input, Badge } from '@/components/UI';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please provide an email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage(result.message || 'Password reset link sent to your email.');
      } else {
        setError(result.message || 'Failed to dispatch password reset request.');
      }
    } catch (err) {
      setError('Connection failed. Server is offline.');
    } finally {
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
                <Badge variant="premium" className="mx-auto">Account Recovery</Badge>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Forgot Password
                </h2>
                <p className="text-xs text-slate-500">Provide your registered email to receive a password reset link.</p>
              </div>

              <hr className="border-slate-50 dark:border-slate-900" />

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs rounded-xl font-medium">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between text-xs mt-1">
                  <span
                    onClick={() => router.push('/login')}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
                  </span>
                </div>

                <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full mt-2">
                  Request Reset Link <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <hr className="border-slate-50 dark:border-slate-900" />
            </div>
          </Card>
        </div>
      </section>
    </PageWrapper>
  );
}
