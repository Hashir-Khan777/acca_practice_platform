'use client';

import * as React from 'react';
import PageWrapper from '@/components/PageWrapper';
import { Badge, Card } from '@/components/UI';
import { Target, Eye, Compass, Heart, Award, ArrowRight } from 'lucide-react';
import Image from "next/image";
import Hashir from '@/images/hashir.jpeg'
import Ahsan from '@/images/ahsan.jpeg'

export default function AboutPage() {
  const values = [
    { icon: <Target className="w-5 h-5 text-emerald-500" />, title: 'Excellence', text: 'We maintain the highest pedagogical standards in accounting guidelines.' },
    { icon: <Eye className="w-5 h-5 text-amber-500" />, title: 'Syllabus Precision', text: 'Every generated item traces exactly to the actual syllabus objectives.' },
    { icon: <Heart className="w-5 h-5 text-rose-500" />, title: 'Accessibility', text: 'Affordable, premium training accessible on mobile and desktop anytime.' },
    { icon: <Award className="w-5 h-5 text-blue-500" />, title: 'Innovation', text: 'Utilizing modern LLMs to craft realistic, unique testing environments.' },
  ];

  const roadmap = [
    { date: 'Q1 2026', title: 'SaaS Platform Beta', status: 'Completed', desc: 'Released core practice dashboard with multi-topic selection and timer options.' },
    { date: 'Q2 2026', title: 'Gemini 3.5 Integration', status: 'Completed', desc: 'Implemented structured JSON response schemas for 100% stable exam generation.' },
    { date: 'Q3 2026', title: 'Excel Style Questions', status: 'Active', desc: 'Building complex computational grids for financial reporting practice tables.' },
    { date: 'Q4 2026', title: 'AI Essay Evaluator', status: 'Planned', desc: 'Deploying semantic analysis tools to grade Strategic Business Leader essays.' },
  ];

  return (
    <PageWrapper>
      {/* Intro Hero */}
      <section className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <Badge variant="info" className="mx-auto">Our Story</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pioneering the Future of Professional Education
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            We are a team of certified Chartered Accountants, SaaS creators, and AI engineers committed to making world-class practice materials instantly accessible to anyone, anywhere.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-16 px-4 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why We Built Accountly AI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Studying for the exam can be incredibly taxing. Standard training centers charge thousands of dollars for fixed-size static textbooks and old mock PDF sets. If you fail, you receive little context as to where you went wrong, or what topics you failed to grasp.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We realized that generative artificial intelligence can act as a personal, 24/7 tutor. By fine-tuning large language models on the exact syllabus curriculum, we can give students a customized practicing canvas that generates fresh, highly rigorous case scenarios, grades them instantly, and explains the concepts step-by-step.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-950 p-6 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col gap-4 text-left shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-emerald-500">
              Our Foundations
            </h3>
            <div className="flex flex-col gap-4 text-xs">
              <div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">Our Mission:</span>
                <p className="text-slate-500 mt-1">To accelerate and simplify the exam path for 1 million students globally by delivering responsive, premium SaaS training tools.</p>
              </div>
              <hr className="border-slate-100 dark:border-slate-800/80" />
              <div>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">Our Vision:</span>
                <p className="text-slate-500 mt-1">A world where financial qualification training is highly interactive, customized to individual weaknesses, and accessible with zero financial barriers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col gap-12 text-center">
          <div className="flex flex-col gap-3">
            <Badge variant="success" className="mx-auto">Values</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Our Core Principles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <Card key={i} className="p-6 text-left flex flex-col gap-3" hoverable>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl w-fit">{v.icon}</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{v.title}</h4>
                <p className="text-xs text-slate-500">{v.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Roadmap */}
      {/* <section id="roadmap" className="py-16 px-4 bg-slate-50 dark:bg-slate-900 border-t border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <div className="text-center flex flex-col gap-3">
            <Badge variant="warning" className="mx-auto">SaaS Roadmap</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Our Product Roadmap</h2>
            <p className="text-xs text-slate-500">How we are rolling out new features to support students over the year.</p>
          </div>

          <div className="flex flex-col gap-6 relative">
            {roadmap.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-950 p-6 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{item.date}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">{item.desc}</p>
                </div>
                <Badge variant={item.status === 'Completed' ? 'success' : item.status === 'Active' ? 'warning' : 'info'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Meet the Team */}
      <section id="team" className="py-16 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto flex flex-col gap-12 text-center">
          <div className="flex flex-col gap-3">
            <Badge variant="premium" className="mx-auto">Creators</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Meet the Founders</h2>
            <p className="text-xs text-slate-500">The core team blending accounting expertise with elite product scaling.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
            <Card className="p-6 text-center flex flex-col items-center gap-4" hoverable>
              <Image src={Hashir} alt="Founder 1" className="w-20 h-20 rounded-full object-cover border border-slate-100 shadow-sm" />
              <div className="flex flex-col">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Muhammad Hashir, ACCA Student</h4>
                {/* <span className="text-xs text-slate-500">Founder & Chief Executive Officer</span> */}
              </div>
              {/* <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Ex-Big 4 Auditor with 12+ years of teaching FR and AAA levels at premier business schools.</p> */}
            </Card>

            <Card className="p-6 text-center flex flex-col items-center gap-4" hoverable>
              <Image src={Ahsan} alt="Founder 2" className="w-20 h-20 rounded-full object-cover border border-slate-100 shadow-sm" />
              <div className="flex flex-col">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Muhammad Ahsan, ICAP student</h4>
                {/* <span className="text-xs text-slate-500">Co-Founder & Chief Marketing Officer</span> */}
              </div>
              {/* <p className="text-xs text-slate-500 max-w-xs leading-relaxed">SaaS engineer specialized in fine-tuning prompts, persistent databases, and educational models.</p> */}
            </Card>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
