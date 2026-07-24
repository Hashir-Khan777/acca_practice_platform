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

  const handleGoogleLoginCallback = async (response: any) => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
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
  };

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-abcdef.apps.googleusercontent.com';
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginCallback
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('googleBtn'),
          { theme: 'outline', size: 'large', width: 380 }
        );
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

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
                
                {/* Google Sign-in Buttons */}
                <div className="flex flex-col gap-3">
                  <div id="googleBtn" className="w-full flex justify-center"></div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-150 dark:border-slate-850"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-mono tracking-widest">Or email login</span>
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
                    className="text-slate-405 hover:text-emerald-505 transition-colors cursor-pointer"
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
