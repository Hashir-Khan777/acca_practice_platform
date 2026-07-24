'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Input, Badge } from '@/components/UI';
import { ShieldAlert, KeyRound } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Invalid reset token parameter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('Your password has been successfully reset! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError(result.message || 'Token expired or invalid.');
      }
    } catch (err) {
      setError('Connection failed. Server is offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center items-center py-6">
        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Missing Reset Token</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          A valid reset token parameter is required. Please check the link sent to your email.
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push('/login')} className="mt-2">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

      <Input
        label="New Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full mt-2">
        Reset Password <KeyRound className="w-4 h-4 ml-2" />
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
                  Reset Password
                </h2>
                <p className="text-xs text-slate-500">Provide a new secure password for your account.</p>
              </div>

              <hr className="border-slate-50 dark:border-slate-900" />

              <React.Suspense
                fallback={
                  <div className="flex flex-col items-center py-6 gap-2">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-mono">Loading form parameters...</span>
                  </div>
                }
              >
                <ResetPasswordForm />
              </React.Suspense>

              <hr className="border-slate-50 dark:border-slate-900" />
            </div>
          </Card>
        </div>
      </section>
    </PageWrapper>
  );
}
