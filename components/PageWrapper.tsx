'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { loadStore, saveStore, User } from '@/lib/store';
import { ThemeToggle, Button, Input } from '@/components/UI';
import { BookOpen, User as UserIcon, Menu, X, Mail, Shield, Check, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PageWrapper({
  children,
  hideNavFooter = false,
}: {
  children: React.ReactNode;
  hideNavFooter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [store, setStore] = React.useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [emailSubscribed, setEmailSubscribed] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState('');
  const [emailError, setEmailError] = React.useState('');

  React.useEffect(() => {
    async function checkSession() {
      const initialTheme = typeof window !== 'undefined' ? (localStorage.getItem('acca_theme') || 'light') : 'light';
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setStore({
              currentUser: json.data.user,
              theme: initialTheme
            });
            if (initialTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            return;
          }
        }
      } catch (e) {}
      setStore({
        currentUser: null,
        theme: initialTheme
      });
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    checkSession();
  }, []);

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-slate-500">Loading Accountly Platform...</p>
        </div>
      </div>
    );
  }

  const toggleTheme = () => {
    const nextTheme = store.theme === 'light' ? 'dark' : 'light';
    const updated = { ...store, theme: nextTheme };
    setStore(updated);
    saveStore(updated);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setStore({ ...store, currentUser: null });
    router.push('/login');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!emailInput) {
      setEmailError('Please enter an email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailInput)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailSubscribed(true);
    setEmailInput('');
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className={`min-h-screen flex flex-col text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300`}>
      {/* HEADER */}
      {!hideNavFooter && (
        <header id="site-header" className="sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div
              onClick={() => router.push('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <img src="/logo.jpg" alt="Accountly Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-all" />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-950 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Accountly <span className="text-emerald-500 font-extrabold font-mono text-sm uppercase px-1.5 py-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10">AI</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <span
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`text-sm font-medium transition-colors cursor-pointer hover:text-emerald-500 ${
                    pathname === item.href ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.name}
                </span>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle theme={store.theme} onToggle={toggleTheme} />

              {store.currentUser ? (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(store.currentUser.role === 'admin' ? '/admin' : '/dashboard')}
                    className="flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    {store.currentUser.role === 'admin' ? 'Admin Portal' : 'My Dashboard'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    onClick={() => router.push('/login')}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer px-3 py-2"
                  >
                    Log In
                  </span>
                  <Button size="sm" onClick={() => router.push('/register')}>
                    Register Free
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-3">
              <ThemeToggle theme={store.theme} onToggle={toggleTheme} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden"
              >
                <div className="px-4 py-6 flex flex-col gap-4">
                  {navItems.map((item) => (
                    <span
                      key={item.name}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push(item.href);
                      }}
                      className={`text-base font-semibold py-1.5 cursor-pointer hover:text-emerald-500 ${
                        pathname === item.href ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.name}
                    </span>
                  ))}
                  <hr className="border-slate-100 dark:border-slate-800" />
                  {store.currentUser ? (
                    <div className="flex flex-col gap-3">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push(store.currentUser.role === 'admin' ? '/admin' : '/dashboard');
                        }}
                      >
                        {store.currentUser.role === 'admin' ? 'Admin Portal' : 'My Dashboard'}
                      </Button>
                      <Button variant="ghost" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button variant="outline" onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}>
                        Log In
                      </Button>
                      <Button variant="primary" onClick={() => { setMobileMenuOpen(false); router.push('/register'); }}>
                        Register Free
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* CORE BODY */}
      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-grow flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* CALL TO ACTION & FOOTER */}
      {!hideNavFooter && (
        <>
          {/* Newsletter / CTA Section */}
          <section className="bg-slate-100/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/55 py-16 px-4">
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Accelerate Your Journey Today
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl text-sm leading-relaxed">
                Join thousands of students who pass exams on their first attempt with personalized AI generation, performance heatmaps, and streak boosters.
              </p>

              {emailSubscribed ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-semibold">Thank you! You have successfully subscribed to our study tips mailing list.</span>
                </motion.div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                  <div className="flex-grow">
                    <Input
                      type="email"
                      placeholder="Enter your study email..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      error={emailError}
                      className="bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <Button variant="primary" type="submit" className="w-full h-[46px]">
                      Subscribe Now
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Professional Footer */}
          <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.jpg" alt="Accountly Logo" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="font-bold text-base text-slate-900 dark:text-white">Accountly AI Practice</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The ultimate simulation practice engine for all levels. Driven by custom fine-tuned Accountly AI models.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Licensed Accountly AI Content Guidelines compliant.</span>
                </div>
              </div>

              {/* Middle Column 1 */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-widest mb-4">
                  Platform
                </h4>
                <ul className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <li onClick={() => router.push('/')} className="hover:text-emerald-500 transition-colors cursor-pointer">Home</li>
                  <li onClick={() => router.push('/features')} className="hover:text-emerald-500 transition-colors cursor-pointer">AI Features</li>
                  <li onClick={() => router.push('/#pricing')} className="hover:text-emerald-500 transition-colors cursor-pointer">Subscription Pricing</li>
                  <li onClick={() => router.push('/#faqs')} className="hover:text-emerald-500 transition-colors cursor-pointer">FAQs</li>
                </ul>
              </div>

              {/* Middle Column 2 */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-widest mb-4">
                  Organization
                </h4>
                <ul className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <li onClick={() => router.push('/about')} className="hover:text-emerald-500 transition-colors cursor-pointer">Our Mission</li>
                  {/* <li onClick={() => router.push('/about#roadmap')} className="hover:text-emerald-500 transition-colors cursor-pointer">SaaS Roadmap</li> */}
                  <li onClick={() => router.push('/contact')} className="hover:text-emerald-500 transition-colors cursor-pointer">Get in Touch</li>
                  <li onClick={() => router.push('/about#team')} className="hover:text-emerald-500 transition-colors cursor-pointer">Meet the Team</li>
                </ul>
              </div>

              {/* Right Column */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-widest mb-4">
                  Security & Compliance
                </h4>
                <ul className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <li onClick={() => router.push('/terms')} className="hover:text-emerald-500 transition-colors cursor-pointer flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Terms & Conditions
                  </li>
                  <li onClick={() => router.push('/privacy')} className="hover:text-emerald-500 transition-colors cursor-pointer flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" /> Privacy & Cookies
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>All services Operational</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-900/60 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[11px] text-slate-400 font-mono">
                © {new Date().getFullYear()} Accountly Practice Platform. Built for premium digital exam preps.
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
