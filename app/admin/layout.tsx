'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { loadStore, saveStore } from '@/lib/store';
import { Button, ThemeToggle } from '@/components/UI';
import {
  LayoutDashboard, Users, BookOpen, Shield, Inbox, Bell, AlertTriangle, Settings, LogOut, Activity
} from 'lucide-react';

import { AdminContext } from './context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [store, setStore] = React.useState<any>(null);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function initAdmin() {
      try {
        // 1. Fetch current admin user profile
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userJson = await userRes.json();
        if (!userJson.success || userJson.data.user.role !== 'admin') {
          router.push('/login');
          return;
        }

        const currentUser = userJson.data.user;
        const initialTheme = typeof window !== 'undefined' ? (localStorage.getItem('acca_theme') || 'light') : 'light';

        // 2. Fetch student accounts
        const studentsRes = await fetch('/api/admin/students');
        const studentsJson = await studentsRes.json();
        const users = studentsJson.success ? studentsJson.data.students : [];

        // 3. Fetch admin tickets
        const ticketsRes = await fetch('/api/admin/tickets');
        const ticketsJson = await ticketsRes.json();
        const tickets = ticketsJson.success ? ticketsJson.data.tickets : [];

        // 4. Fetch announcements
        const annRes = await fetch('/api/admin/announcements');
        const annJson = await annRes.json();
        const announcements = annJson.success ? annJson.data.announcements : [];

        // 5. Fetch inbox messages
        const msgRes = await fetch('/api/admin/inbox');
        const msgJson = await msgRes.json();
        const contactMessages = msgJson.success ? msgJson.data.messages : [];

        // 6. Fetch audit logs
        const logsRes = await fetch('/api/admin/logs');
        const logsJson = await logsRes.json();
        const auditLogs = logsJson.success ? logsJson.data.logs : [];

        // 7. Fetch syllabus
        const sylRes = await fetch('/api/admin/syllabus');
        const sylJson = await sylRes.json();
        const subjects = sylJson.success ? sylJson.data.subjects : [];
        const topics = sylJson.success ? sylJson.data.topics : [];

        // Fetch attempts for admin performance analytics widgets
        const attemptsRes = await fetch('/api/student/attempts');
        const attemptsJson = await attemptsRes.json();
        const attempts = attemptsJson.success ? attemptsJson.data.attempts : [];

        setStore({
          currentUser,
          users: [currentUser, ...users],
          tickets,
          announcements,
          contactMessages,
          auditLogs,
          subjects,
          topics,
          attempts,
          theme: initialTheme
        });

        // Apply theme
        if (initialTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

      } catch (err) {
        console.error('Failed to initialize admin dashboard portal:', err);
        router.push('/login');
      }
    }
    initAdmin();
  }, [router]);

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-slate-500">Initializing Admin Portal...</p>
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/login');
  };

  const adminNavItems = [
    { id: 'overview', name: 'HQ Overview', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', name: 'Student Accounts', path: '/admin/students', icon: <Users className="w-4 h-4" /> },
    { id: 'syllabus', name: 'Subjects & Syllabus', path: '/admin/syllabus', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tickets', name: 'Support Tickets', path: '/admin/tickets', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'inbox', name: 'Visitor Inbox', path: '/admin/inbox', icon: <Inbox className="w-4 h-4" /> },
    { id: 'announcements', name: 'Announcements', path: '/admin/announcements', icon: <Bell className="w-4 h-4" /> },
    { id: 'logs', name: 'Audit Logs', path: '/admin/logs', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', name: 'HQ Configs', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <AdminContext.Provider
      value={{
        store,
        setStore,
        updateStore,
        success,
        setSuccess,
        error,
        setError,
      }}
    >
      <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300">
        
        {/* HEADER BAR */}
        <header className="h-16 border-b border-slate-150 dark:border-slate-800/60 bg-white dark:bg-slate-950/85 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-slate-950 to-slate-850 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              ACCA Admin HQ
            </span>
            <span className="text-[10px] uppercase font-mono font-extrabold text-orange-500 px-2 py-0.5 bg-orange-500/10 rounded-md">
              SLA Control
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle theme={store.theme} onToggle={toggleTheme} />
            
            <div className="flex items-center gap-2.5 border-l border-slate-100 dark:border-slate-800 pl-4">
              <img src={store.currentUser.photo} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">Master Admin</span>
                <span className="text-[10px] text-orange-500 font-mono font-bold">System Root</span>
              </div>
            </div>
          </div>
        </header>

        {/* CORE WORKSPACE FRAMEWORK */}
        <div className="flex-grow flex relative overflow-hidden">
          
          {/* DESKTOP SIDEBAR */}
          <aside className="w-64 border-r border-slate-150 dark:border-slate-800/60 bg-white dark:bg-slate-950 hidden md:flex flex-col justify-between py-6 px-4">
            <div className="flex flex-col gap-6">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-extrabold px-2.5">ADMIN MODULES</span>
              
              <nav className="flex flex-col gap-1">
                {adminNavItems.map((tab) => {
                  const isActive = pathname === tab.path;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => router.push(tab.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-l-4 border-orange-500 pl-3'
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

            <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-rose-500" onClick={handleLogout}>
              Logout Session <LogOut className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </aside>

          {/* WORKSPACE CENTRAL WORKSPACE SCREEN */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-6 text-left">
            {/* Feedback alert messages */}
            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-bold">
                {success}
              </div>
            )}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl font-bold">
                {error}
              </div>
            )}

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

      </div>
    </AdminContext.Provider>
  );
}
