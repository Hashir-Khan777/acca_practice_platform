'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  loadStore, saveStore,
  User, Subject, Topic, Question, Quiz, Attempt, SupportTicket, Announcement
} from '@/lib/store';
import { Button, Card, Progress, ThemeToggle, Dialog } from '@/components/UI';
import {
  LayoutDashboard, BookOpen, Clock, BarChart3, HelpCircle, User as UserIcon,
  Settings, Award, Zap, Bell, Search, Menu, X, ArrowRight, Check, AlertTriangle,
  RotateCcw, Share2, Download, Bookmark, ChevronRight, FileText, Compass, Trash2, Shield, Sparkles, Send, CheckCircle
} from 'lucide-react';

import { DashboardContext } from './context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [store, setStore] = React.useState<any>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotificationBadge, setShowNotificationBadge] = React.useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  React.useEffect(() => {
    const data = loadStore();
    // Validate that student is logged in
    if (!data.currentUser || data.currentUser.role !== 'student') {
      router.push('/login');
      return;
    }
    setStore(data);

    // Apply active theme
    if (data.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Build notifications
    const initialNotes = [
      { id: 'n-1', title: 'Welcome to ACCA AI!', desc: 'Create your first practice quiz with Google Gemini to start your daily streak.', date: 'Just now', read: false },
      { id: 'n-2', title: 'Milestone Alert', desc: 'Achieve a 7-day streak to unlock the "Topic Master" badge.', date: '1 hour ago', read: false }
    ];
    setNotifications(initialNotes);
  }, [router]);

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-slate-500">Initializing Student Portal...</p>
        </div>
      </div>
    );
  }

  const updateStore = (updatedData: any) => {
    setStore(updatedData);
    saveStore(updatedData);
  };

  const toggleTheme = () => {
    const nextTheme = store.theme === 'light' ? 'dark' : 'light';
    const updated = { ...store, theme: nextTheme };
    updateStore(updated);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    const updated = { ...store, currentUser: null };
    saveStore(updated);
    router.push('/login');
  };

  const navItems = [
    { id: 'overview', name: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'practice', name: 'Practice Quiz', path: '/dashboard/practice', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'history', name: 'Quiz History', path: '/dashboard/history', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', name: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'recommendations', name: 'Smart Recommendations', path: '/dashboard/recommendations', icon: <Compass className="w-4 h-4" /> },
    { id: 'achievements', name: 'Achievements', path: '/dashboard/achievements', icon: <Award className="w-4 h-4" /> },
    { id: 'notifications', name: 'Announcements', path: '/dashboard/notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'profile', name: 'Student Profile', path: '/dashboard/profile', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'subscription', name: 'Subscription', path: '/dashboard/subscription', icon: <Shield className="w-4 h-4" /> },
    { id: 'help', name: 'Help Center', path: '/dashboard/help', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'settings', name: 'SaaS Settings', path: '/dashboard/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <DashboardContext.Provider
      value={{
        store,
        setStore,
        updateStore,
        notifications,
        setNotifications,
        showNotificationBadge,
        setShowNotificationBadge,
        showUpgradeModal,
        setShowUpgradeModal,
      }}
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300">
        
        {/* HEADER BAR */}
        <header className="h-16 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950/85 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm tracking-tight hidden sm:inline bg-gradient-to-r from-slate-950 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                ACCA AI Portal
              </span>
            </div>
          </div>

          {/* Action Widgets */}
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
                <Zap className="w-3.5 h-3.5 fill-current" /> Streak: {store.streak.currentStreak} Days
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                Level: {store.currentUser.plan === 'premium' ? 'Premium Full-Pass' : 'Free Tier'}
              </span>
            </div>

            <ThemeToggle theme={store.theme} onToggle={toggleTheme} />
            
            {/* Notifications Trigger */}
            <div className="relative cursor-pointer" onClick={() => { router.push('/dashboard/notifications'); setShowNotificationBadge(false); }}>
              <div className="p-2.5 border border-slate-100 hover:border-slate-200 dark:border-slate-850 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-400 transition-all">
                <Bell className="w-4 h-4" />
              </div>
              {showNotificationBadge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* User Icon Avatar */}
            <div className="flex items-center gap-2.5 border-l border-slate-100 dark:border-slate-800/80 pl-4">
              <img src={store.currentUser.photo} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{store.currentUser.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">Student</span>
              </div>
            </div>
          </div>
        </header>

        {/* CORE FRAMEWORK */}
        <div className="flex-grow flex relative">
          
          {/* DESKTOP SIDEBAR */}
          <aside className="w-64 border-r border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 hidden md:flex flex-col justify-between py-6 px-4">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 text-left px-2.5">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-extrabold">WORKSPACE</span>
                <span className="text-xs text-slate-500 font-medium truncate w-[200px]" title={store.currentUser.email}>{store.currentUser.email}</span>
              </div>
              
              <nav className="flex flex-col gap-1">
                {navItems.map((tab) => {
                  const isActive = pathname === tab.path;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => router.push(tab.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 pl-3'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      {tab.icon}
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-3 px-2">
              {store.currentUser.plan === 'free' && (
                <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 rounded-2xl flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-purple-600 dark:text-purple-400 font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Upgrade Study Power
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">Unlock unlimited Gemini mock generations and PDF report card downloads.</p>
                  <Button size="sm" variant="primary" className="h-[32px] mt-1" onClick={() => setShowUpgradeModal(true)}>
                    Go Premium
                  </Button>
                </Card>
              )}
              <Button variant="ghost" size="sm" className="w-full text-slate-500" onClick={handleLogout}>
                Logout Profile
              </Button>
            </div>
          </aside>

          {/* MOBILE SIDEBAR DRAWER */}
          <AnimatePresence>
            {mobileSidebarOpen && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                />
                <motion.aside
                  initial={{ x: -260 }}
                  animate={{ x: 0 }}
                  exit={{ x: -260 }}
                  className="relative w-64 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-850 h-full flex flex-col justify-between p-4 z-10 text-left"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="font-extrabold text-sm text-emerald-500">ACCA Workspace</span>
                      <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded-full text-slate-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <nav className="flex flex-col gap-1">
                      {navItems.map((tab) => {
                        const isActive = pathname === tab.path;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setMobileSidebarOpen(false);
                              router.push(tab.path);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 pl-3'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                            }`}
                          >
                            {tab.icon}
                            {tab.name}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={handleLogout}>Logout Profile</Button>
                  </div>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>

          {/* WORKSPACE CENTRAL WORKSPACE SCREEN */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-col gap-6"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Premium Upgrade Modal */}
        <Dialog isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Upgrade to Full-Pass Premium">
          <div className="flex flex-col gap-5 text-left py-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              Gain unlimited access to fine-tuned Google Gemini 3.5 AI question generations, smart topic weakness tracking metrics, and detailed report scorecard downloads.
            </p>
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-bold">Premium Subscription</span>
                <span className="text-[10px] text-slate-400">Billed monthly. Cancel anytime.</span>
              </div>
              <span className="text-2xl font-extrabold font-mono text-emerald-400">$19 / mo</span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Unlimited exam-style simulated quiz builds</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Full compliance with all IAS / IFRS standards</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Direct priority SLA help desk ticket channels</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const updatedUser = { ...store.currentUser, plan: 'premium' as const };
                  const updatedStore = {
                    ...store,
                    currentUser: updatedUser,
                    users: store.users.map((u: any) => u.id === store.currentUser.id ? updatedUser : u)
                  };
                  updateStore(updatedStore);
                  setShowUpgradeModal(false);
                  alert('Account upgraded to PREMIUM successfully!');
                }}
              >
                Confirm Payment ($19)
              </Button>
            </div>
          </div>
        </Dialog>

      </div>
    </DashboardContext.Provider>
  );
}
