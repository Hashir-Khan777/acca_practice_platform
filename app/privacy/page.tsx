'use client';

import * as React from 'react';
import PageWrapper from '@/components/PageWrapper';
import { Badge, Card } from '@/components/UI';

export default function PrivacyPage() {
  return (
    <PageWrapper>
      <section className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <Badge variant="info" className="mx-auto">Compliance Center</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: July 11, 2026</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50/50 dark:bg-slate-900/10 text-left">
        <Card className="max-w-4xl mx-auto p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl">
          <div className="prose dark:prose-invert max-w-none flex flex-col gap-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">1. Data Collected</h3>
              <p>
                We collect your name, study email address, country, and selected level during registration to customize your dashboard layout and recommendation algorithms. No sensitive banking details are held on our servers; all transaction invoices are routed securely through certified payment gateways.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">2. How We Utilize Your Study Data</h3>
              <p>
                Your historical quiz submissions, skipped questions, bookmarks, and daily streak timestamps are processed strictly inside our local recommendation algorithm to detect weak subjects and map your customized study recommendations.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">3. Cookies & Local Storage</h3>
              <p>
                The platform relies heavily on secure browser cookies and client-side storage keys (such as localStorage) to persist active student login profiles, selected light/dark theme preferences, and current quiz answering states. This prevents any data loss from sudden browser tab terminations.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">4. Third Party API Services</h3>
              <p>
                We transmit parameters (Subject, Topic, and Difficulty) to Google Gemini API servers to generate unique quiz questions. No personal identifying information (e.g. your email or name) is ever sent to Google AI services.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">5. Data Deletion Rights</h3>
              <p>
                Under GDPR guidelines, you retain full rights to wipe or export your complete study profiles. You can initiate instant profile erasure directly inside your dashboard settings panel, which purges all stored streak metrics and history immediately.
              </p>
            </div>

          </div>
        </Card>
      </section>
    </PageWrapper>
  );
}
