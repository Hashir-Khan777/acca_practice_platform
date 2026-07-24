'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Input, Badge } from '@/components/UI';
import { ShieldCheck, RefreshCw, LogIn } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data.user) {
            setEmail(json.data.user.email);
            if (json.data.user.emailVerified) {
              router.push('/dashboard');
            }
          }
        }
      } catch (e) {}
    }
    loadUser();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(result.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setError('Connection error. Server is unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('A new verification code has been dispatched.');
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message || 'Failed to resend verification code.');
      }
    } catch (err) {
      setError('Connection error. Server is unreachable.');
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
                <Badge variant="premium" className="mx-auto">Two-Factor Authentication</Badge>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Verify Email Address
                </h2>
                <p className="text-xs text-slate-500">A 6-digit numeric verification code was sent to your email.</p>
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

              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="6-Digit Verification Code"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  className="tracking-[0.5em] text-center font-mono text-lg font-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                />

                <div className="flex items-center justify-between text-xs mt-1">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${cooldown > 0 ? 'text-slate-405 cursor-not-allowed' : 'text-emerald-500 hover:text-emerald-600'}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cooldown > 0 ? '' : 'animate-spin-hover'}`} />
                    {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Verification Code'}
                  </button>
                  
                  <span
                    onClick={() => router.push('/login')}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Back to Log In <LogIn className="w-3.5 h-3.5" />
                  </span>
                </div>

                <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full mt-2">
                  Verify & Continue <ShieldCheck className="w-4 h-4 ml-2" />
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
