'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Input, Badge } from '@/components/UI';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleGoogleLogin = () => {
    if (typeof window === 'undefined' || !(window as any).google) {
      setError('Google Authentication service is loading. Please try again in a moment.');
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-abcdef.apps.googleusercontent.com';
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error_description || 'Google Authentication failed.');
            return;
          }
          if (tokenResponse.access_token) {
            setError('');
            setIsSubmitting(true);
            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: tokenResponse.access_token })
              });
              const result = await res.json();
              if (res.ok && result.success) {
                setIsSubmitting(false);
                router.push('/dashboard');
              } else {
                setError(result.message || 'Google Authentication failed.');
                setIsSubmitting(false);
              }
            } catch (err: any) {
              setError('Connection failed. Database or Google Authentication route is offline.');
              setIsSubmitting(false);
            }
          }
        }
      });
      client.requestAccessToken();
    } catch (e: any) {
      setError('Google Sign-In initialization failed.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setIsSubmitting(false);

        if (result.data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        return;
      } else {
        setError(result.message || 'Invalid credentials.');
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
                <Badge variant="premium" className="mx-auto">Secure Account Gateway</Badge>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Log In to Practice
                </h2>
                <p className="text-xs text-slate-500">Access your streaks, generated exams, and smart recommendations.</p>
              </div>

              <hr className="border-slate-50 dark:border-slate-900" />

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                
                {/* Custom Google Sign-in Button */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2.5 h-11 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <svg className="w-4.5 h-4.5 select-none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Button>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-150 dark:border-slate-850"></div>
                  <span className="flex-shrink mx-4 text-slate-405 text-[10px] uppercase font-mono tracking-widest">Or email login</span>
                  <div className="flex-grow border-t border-slate-150 dark:border-slate-850"></div>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Secure Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between text-xs font-mono mt-1">
                  <span
                    onClick={() => router.push('/forgot-password')}
                    className="text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </span>
                  <span
                    onClick={() => router.push('/register')}
                    className="text-emerald-500 hover:underline cursor-pointer"
                  >
                    Create Free Account
                  </span>
                </div>

                <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full mt-2">
                  Sign In <LogIn className="w-4 h-4 ml-2" />
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
