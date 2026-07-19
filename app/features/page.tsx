'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Badge } from '@/components/UI';
import {
  Brain, Award, BarChart3, TrendingUp, Smartphone, ShieldCheck,
  Zap, Compass, Play, Check, ChevronRight
} from 'lucide-react';

export default function FeaturesPage() {
  const router = useRouter();

  const primaryFeatures = [
    {
      badge: 'AI ENGINE',
      title: 'Adaptive Quiz Generator',
      description: 'Never practice with the exact same stale questions again. Our custom Accountly AI models ingest your exact Subject and Topic to craft authentic, highly challenging case scenarios on-the-fly.',
      bullets: [
        'Select MCQ, Input, or standard Excel types.',
        'Choose Easy, Medium, or Hard difficulty levels.',
        'Ensures 100% stable, compliant JSON outputs.',
        'No markdown, preambles, or formatting glitches.'
      ],
      icon: <Brain className="w-6 h-6 text-emerald-500" />
    },
    {
      badge: 'GAMIFICATION',
      title: 'Daily Streak Tracker & Milestones',
      description: 'Pass rates are heavily linked to consistency. We maintain study discipline by tracking consecutive practicing days and rewarding milestone triggers.',
      bullets: [
        'Resets to zero if you skip a full calendar day.',
        'Streaks displayed prominently on Student dashboard.',
        'Staggered streak milestones (7-day, 14-day, 30-day).',
        'Unlocks beautiful badges and certificates.'
      ],
      icon: <Zap className="w-6 h-6 text-amber-500" />
    },
    {
      badge: 'ANALYTICS',
      title: 'Performance & Weak Area Spotter',
      description: 'Avoid reviewing material you already know. We log all historical attempts and map individual answers to specific IAS/IFRS/ISA syllabus chapters to identify weaknesses.',
      bullets: [
        'Funnels specific weak topics into suggested quizzes.',
        'Renders weekly and monthly accuracy graphs.',
        'Tracks average answer response duration.',
        'Calculates a personalized progress rating.'
      ],
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />
    }
  ];

  return (
    <PageWrapper>
      {/* Hero Banner */}
      <section className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <Badge variant="premium" className="mx-auto">Platform Tour</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Comprehensive Practice Toolkit
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Review detailed descriptions of the key technology modules that help students achieve up to 28% higher pass rates compared to traditional methods.
          </p>
        </div>
      </section>

      {/* Main Features Layout */}
      <section className="py-20 px-4 bg-slate-50/50 dark:bg-slate-900/10">
        <div className="max-w-5xl mx-auto flex flex-col gap-24">
          {primaryFeatures.map((feat, idx) => (
            <div
              key={idx}
              className={`flex flex-col lg:flex-row items-center gap-12 ${
                idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Feature Text */}
              <div className="flex-1 flex flex-col items-start gap-5 text-left">
                <Badge variant={idx === 0 ? 'premium' : idx === 1 ? 'warning' : 'info'}>
                  {feat.badge}
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {feat.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
                
                <div className="flex flex-col gap-3 mt-2">
                  {feat.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="p-0.5 bg-emerald-500/10 rounded-full text-emerald-500">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphic Mock Placeholder */}
              <div className="flex-1 w-full max-w-md">
                <Card className="p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col gap-4 text-left shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      {feat.icon}
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Module Status: Active
                    </span>
                  </div>
                  <hr className="border-slate-50 dark:border-slate-850" />
                  <div className="flex flex-col gap-2 font-mono text-[11px] text-slate-400">
                    <p>SYSTEM_CORE_INIT: OK</p>
                    <p>ACCOUNTLY_API_HANDSHAKE: ACTIVE</p>
                    <p>ACC_SYLLABUS_MAPPING: SUCCESS (100%)</p>
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Minor Benefits Grid */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 text-center">
          <div className="flex flex-col gap-3">
            <Badge variant="success" className="mx-auto">Performance Features</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Built for Scalable Speed</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 flex flex-col items-center gap-3 text-center" hoverable>
              <Smartphone className="w-8 h-8 text-emerald-500" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">100% Mobile Optimized</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Practice while traveling. The entire student interface works perfectly on any mobile layout.</p>
            </Card>
            
            <Card className="p-6 flex flex-col items-center gap-3 text-center" hoverable>
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Secure Auth & Cookies</h4>
              <p className="text-xs text-slate-500 leading-relaxed">JWT verification and secure localStorage wrappers guarantee your practice progress is always backed up.</p>
            </Card>

            <Card className="p-6 flex flex-col items-center gap-3 text-center" hoverable>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Continuous AI Updates</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We sync our model settings on every syllabus change, ensuring your practices reflect current law standards.</p>
            </Card>
          </div>

          {/* Bottom Call to Action */}
          <div className="mt-8">
            <Button size="lg" onClick={() => router.push('/register')} className="shadow-lg">
              Unlock All Features Now <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
