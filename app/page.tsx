'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Badge } from '@/components/UI';
import {
  Brain, Zap, Trophy, ShieldAlert, CheckCircle, BarChart3, Clock,
  ArrowRight, Users, Play, Star, ChevronDown, Check, GraduationCap, MapPin, X
} from 'lucide-react';
import { motion } from 'motion/react';

export default function HomePage() {
  const router = useRouter();
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  const stats = [
    { label: 'Active Accountly Aspirants', value: '14,250+' },
    { label: 'Practice Quizzes Generated', value: '450,000+' },
    { label: 'Average Score Improvement', value: '28%' },
    { label: 'Syllabus Coverage Rate', value: '100%' },
  ];

  const features = [
    {
      icon: <Brain className="w-6 h-6 text-emerald-500" />,
      title: 'Adaptive AI Generator',
      description: 'Generates unlimited, fresh, challenging quiz questions tailored specifically to your chosen Subject, Topic, and Difficulty.',
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: 'Daily Streak Tracker',
      description: 'Maintains study consistency. Tracks your practice streaks and boosts discipline with reward points and achievement badges.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
      title: 'Weak Topic Spotter',
      description: 'Analyzes your quiz history to automatically identify weak areas and recommend specific study paths to turn them into strengths.',
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-purple-500" />,
      title: 'Syllabus Aligned',
      description: 'From foundational business concepts to core technical execution and high-level strategic leadership.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Select Parameters',
      description: 'Choose your course, exact topic, question count, and preferred difficulty level (Easy, Medium, Hard).',
    },
    {
      number: '02',
      title: 'Accountly AI Engine Invocation',
      description: 'Our fine-tuned AI prompts process the parameters to generate authentic, challenging exam-style JSON questions.',
    },
    {
      number: '03',
      title: 'Practice & Review',
      description: 'Answer questions in our timed engine, receive instant detailed standard answers and deep professional explanations.',
    },
  ];

  const testimonials = [
    {
      name: 'Aisha Khan',
      role: 'Foundation Level Student',
      text: "The AI quizzes are a huge help for FA1 and MA1. The best part is that when you get an answer wrong, it doesn't just show you the correct option—it actually explains in detail exactly where you made the mistake.",
      avatar: 'https://picsum.photos/seed/sarah/100/100',
    },
    {
      name: 'Zain Ahmed',
      role: 'Applied Skills Student',
      text: "I was really struggling with Consolidation (IFRS 10) and kept making the same mistakes. The platform flagged that exact weak area and gave me customized practice questions until the concept finally clicked.",
      avatar: 'https://picsum.photos/seed/daniel/100/100',
    },
  ];

  const faqs = [
    {
      q: "Does this platform use the official syllabus?",
      a: "Yes. Our custom Accountly AI models are explicitly guided by the official, current syllabus, covering all primary accounting standards (IAS/IFRS), auditing guidelines (ISAs), and corporate regulations."
    },
    {
      q: "Are the AI-generated questions unique?",
      a: "Absolutely. Every time you click 'Generate', the AI creates a distinct set of case studies, financial calculations, or auditing scenarios, ensuring you never run out of practice materials."
    },
    {
      q: "Is there a limit on how many quizzes I can generate?",
      a: "Free tier users can generate up to 5 quizzes per day. Premium subscribers enjoy unlimited AI generations, detailed report downloads, and custom study plans."
    }
  ];

  return (
    <PageWrapper>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent dark:from-emerald-950/10 opacity-70 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero text */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
            <Badge variant="premium" className="mb-2">
              ✨ Advanced AI Practice for Professional Exams
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
              Master Your Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Accountly AI</span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-xl">
              Generate unlimited customized quizzes, track your study consistency with streak systems, and receive personalized recommendations focused entirely on your weak topics.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-2">
              <Button size="lg" onClick={() => router.push('/register')} className="shadow-lg">
                Start Practicing Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/about')}>
                Learn More
              </Button>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-slate-500 mt-4 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Instant Setup
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Compliant with IAS / IFRS
              </span>
            </div>
          </div>

          {/* Hero Illustration Placeholder / Interactive App Mock */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="px-3 py-1 bg-slate-800/60 rounded-lg text-[10px] font-mono text-emerald-400">
                  AI Quiz Engine v3.5
                </div>
              </div>

              {/* Sample Question preview inside mock */}
              <div className="flex flex-col gap-4 text-left">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                  Syllabus IAS 16 Practice
                </span>
                <p className="text-sm font-semibold text-slate-200">
                  Which of the following describes standard depreciation criteria for capitalized property under IAS 16?
                </p>
                <div className="flex flex-col gap-2 mt-1 text-xs">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-slate-200 flex items-center justify-between">
                    <span>Depreciation commences when asset is available for use.</span>
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-800/80 rounded-xl text-slate-400">
                    <span>Depreciation starts only when the asset is physically placed into production.</span>
                  </div>
                </div>
                <hr className="border-slate-800" />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">Time Left: 14:55</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" /> AI Explained
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PLATFORM STATISTICS / TRUSTED BY */}
      <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stat.value}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 text-center">
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            <Badge variant="info" className="mx-auto">Features Grid</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Powerful Tools Crafted for Success
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Unlock smart study habits and maximize your pass rates with a structured, AI-driven practicing environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, i) => (
              <Card key={i} className="flex flex-col items-start text-left gap-4 p-6" hoverable>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900 border-t border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          <div className="text-center flex flex-col gap-4 max-w-2xl mx-auto">
            <Badge variant="warning" className="mx-auto">Engine Blueprint</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How the Accountly Platform Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              From syllabus setup to targeted practice in three highly efficient steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col gap-4">
                <span className="absolute -top-6 left-6 text-5xl font-extrabold text-emerald-500/20 font-mono">
                  {step.number}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{step.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / STUDENT BENEFITS */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 text-left">
            <Badge variant="success" className="w-fit">Student Benefits</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Elite Students Use AI Practice
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Standard mock exams repeat the same fixed banks of questions. AI gives you personalized, unlimited coverage.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              {[
                'Identifies and tracks weak IAS / IFRS standards automatically.',
                'Saves thousands of hours of looking up complex answers.',
                'Strengthens self-discipline via rewarding practice streaks.',
                'Instant analytics preview of performance and difficulty levels.',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-1 bg-emerald-500/10 rounded-full text-emerald-500 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <Button onClick={() => router.push('/register')}>
                Register Your Account Now
              </Button>
            </div>
          </div>

          <div className="p-8 bg-slate-100 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex flex-col gap-3">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Time Optimized</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Customize timed sessions to match the real exam criteria.</p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex flex-col gap-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Gamified Streaks</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Earn badges for 7-day, 14-day, and 30-day consistent practice.</p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex flex-col gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Weak Spot Detection</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Advanced recommendation engine automatically redirects your review paths.</p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex flex-col gap-3">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Heatmaps & Progress</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Detailed visual graphs to trace accuracy changes over the months.</p>
            </div>
          </div>
        </div>
      </section>
      {/* PRICING SECTION */}
      {/* <section id="pricing" className="py-20 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 text-center">
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            <Badge variant="premium" className="mx-auto">Subscription Plans</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Invest in Your Accounting Career
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Start practicing for free, then upgrade to unlock complete syllabus coverage and advanced dashboard analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 w-full">
            // Free Plan
            <Card className="flex flex-col text-left justify-between p-8 bg-white border border-slate-100 rounded-3xl" hoverable>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Basic Starter</h3>
                  <Badge variant="info">Free</Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                  <span className="text-xs text-slate-500">forever</span>
                </div>
                <p className="text-xs text-slate-500">Perfect for trying out our AI generation engine on basic topics.</p>
                <hr className="border-slate-100 dark:border-slate-800" />
                <ul className="flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 5 AI Quizzes daily</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Applied Knowledge level</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic performance dashboard</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through"><X className="w-4 h-4" /> Weak Topic Smart Recommendations</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through"><X className="w-4 h-4" /> PDF Report download</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full mt-8" onClick={() => router.push('/register')}>
                Get Started
              </Button>
            </Card>

            // Premium Plan
            <Card className="flex flex-col text-left justify-between p-8 bg-slate-950 border border-slate-800 text-white rounded-3xl relative overflow-hidden" hoverable>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Full-Pass Premium</h3>
                  <Badge variant="premium">Most Popular</Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$19</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">Our complete suite of professional exam practice utilities.</p>
                <hr className="border-slate-800" />
                <ul className="flex flex-col gap-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited AI Quizzes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Applied Skills & Strategic levels</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Weak Topic detection & Smart advice</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> PDF Score card exports</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Premium SLA Help Desk support</li>
                </ul>
              </div>
              <Button variant="primary" className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 border-none text-slate-950 font-bold" onClick={() => router.push('/register')}>
                Upgrade to Premium
              </Button>
            </Card>
          </div>
        </div>
      </section> */}

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col gap-16 text-center">
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            <Badge variant="info" className="mx-auto">User Reviews</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Testimonials from Future Chartered Accountants
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Read how students around the world are speeding up their qualifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((test, i) => (
              <Card key={i} className="flex flex-col text-left gap-6 p-8" hoverable>
                <p className="text-slate-600 dark:text-slate-400 text-sm italic leading-relaxed">
                  &ldquo;{test.text}&rdquo;
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <img src={test.avatar} alt={test.name} className="w-11 h-11 rounded-full border border-slate-100 object-cover" />
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">{test.name}</span>
                    <span className="text-xs text-slate-500">{test.role}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faqs" className="py-20 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto flex flex-col gap-16">
          <div className="text-center flex flex-col gap-4">
            <Badge variant="success" className="mx-auto">Support Desk FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Everything you need to know about our Accountly Practice platform.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                
                {activeFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
