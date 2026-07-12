'use client';

import * as React from 'react';
import PageWrapper from '@/components/PageWrapper';
import { Badge, Card } from '@/components/UI';

export default function TermsPage() {
  return (
    <PageWrapper>
      <section className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <Badge variant="info" className="mx-auto">Legal Center</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: July 11, 2026</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50/50 dark:bg-slate-900/10 text-left">
        <Card className="max-w-4xl mx-auto p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl">
          <div className="prose dark:prose-invert max-w-none flex flex-col gap-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h3>
              <p>
                By registering an account on the ACCA AI Practice Platform (&ldquo;the SaaS Service&rdquo;), you confirm your complete acceptance of these Terms & Conditions. If you do not accept these terms, you are prohibited from utilizing any of the AI practice engines or dashboard metrics.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">2. Description of SaaS Services</h3>
              <p>
                We deliver an automated AI-driven practicing environment. The questions generated are simulations designed to test concepts within the ACCA syllabus. We do not issue formal ACCA certifications, nor are we officially endorsed by the Association of Chartered Certified Accountants. All final examinations are managed strictly by the official ACCA body.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">3. Subscription Billing & Fees</h3>
              <p>
                The Free Tier grants access to limited daily generations. The Premium Tier is billed on a rolling monthly subscription. You may terminate your premium renewal at any time via your account billing panel. We issue refunds only in cases of verifiable platform access failures of more than 48 consecutive hours.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">4. AI Usage Boundaries & Fair Play</h3>
              <p>
                Our AI engines are driven by Google Gemini API integrations. You agree not to execute automated scripts, scrapers, or reverse-engineering systems to parse generated questions. Abusive usage patterns will result in immediate role suspension.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">5. SLA & Disclaimer of Warranties</h3>
              <p>
                We do not warrant that all generated solutions are 100% error-free. AI-generated questions are provided &ldquo;as-is.&rdquo; While our tutors actively check the standard database structures, the student is responsible for verifying answers against official ACCA study material.
              </p>
            </div>

          </div>
        </Card>
      </section>
    </PageWrapper>
  );
}
