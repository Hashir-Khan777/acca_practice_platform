'use client';

import * as React from 'react';
import PageWrapper from '@/components/PageWrapper';
import { Button, Card, Input, Badge } from '@/components/UI';
import { Mail, Phone, MapPin, CheckCircle, Globe, Send } from 'lucide-react';
import { motion } from 'motion/react';

export default function ContactPage() {
  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = React.useState<any>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const validate = () => {
    const tempErrors: any = {};
    if (!form.name.trim()) tempErrors.name = 'Name is required.';
    if (!form.email.trim()) {
      tempErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      tempErrors.email = 'Please provide a valid email.';
    }
    if (!form.subject.trim()) tempErrors.subject = 'Subject is required.';
    if (!form.message.trim()) {
      tempErrors.message = 'Message cannot be empty.';
    } else if (form.message.trim().length < 10) {
      tempErrors.message = 'Message should be at least 10 characters long.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setIsSubmitting(false);
        setIsSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setErrors({ submit: result.message || 'Submission failed.' });
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'Database connection error.' });
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      {/* Intro Hero */}
      <section className="py-16 sm:py-24 px-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <Badge variant="info" className="mx-auto">Contact Center</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Can We Assist Your Studies?
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Have questions about institutional licenses, premium billing, or standard syllabi? Drop us a line and our tutor support desk will reply within 12 hours.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-20 px-4 bg-slate-50/50 dark:bg-slate-900/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Business Info / Map Column */}
          <div className="lg:col-span-5 flex flex-col gap-8 text-left">
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Business Office</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our main tutoring syllabus and technology offices are located in London, closely coordinated with major certified learning centers.
              </p>
            </div>

            {/* Core Info Cards */}
            <div className="flex flex-col gap-4">
              <Card className="p-4 flex gap-4 items-center">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">Address</span>
                  <span className="text-xs text-slate-500">12 High Holborn, London, WC1V 6PX, UK</span>
                </div>
              </Card>

              <Card className="p-4 flex gap-4 items-center">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">Student Support Email</span>
                  <span className="text-xs text-slate-500">support@accapractice.ai</span>
                </div>
              </Card>

              <Card className="p-4 flex gap-4 items-center">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">Support Desk Hotline</span>
                  <span className="text-xs text-slate-500">+44 20 7946 0958</span>
                </div>
              </Card>
            </div>

            {/* Google Map Placeholder */}
            <div className="w-full h-48 bg-slate-200 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden relative shadow-inner">
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('https://picsum.photos/seed/london_map/600/300')" }} />
              <div className="absolute inset-0 bg-slate-900/10" />
              <div className="absolute bottom-4 left-4 p-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-xl flex items-center gap-1.5 shadow-md">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">Holborn Office, London</span>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <Card className="p-8 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm text-left relative overflow-hidden">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Submit Inquiry Ticket</h3>
                  <p className="text-xs text-slate-500">All fields must pass strict client validation prior to submission.</p>
                </div>

                <hr className="border-slate-50 dark:border-slate-900" />

                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col items-center text-center gap-3"
                  >
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Inquiry Received Successfully</h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Thank you! Your contact message has been filed and added to the admin messages inbox. A study adviser will contact you shortly.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsSuccess(false)}>
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        placeholder="e.g. Jhon Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        error={errors.name}
                      />
                      <Input
                        label="Study Email Address"
                        type="email"
                        placeholder="e.g. example@gmail.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        error={errors.email}
                      />
                    </div>

                    <Input
                      label="Subject"
                      placeholder="e.g. Institutional license quote request"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      error={errors.subject}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Detailed Message</label>
                      <textarea
                        rows={4}
                        placeholder="Provide details about your inquiry or suggestions..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className={`w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border ${
                          errors.message ? 'border-rose-400 focus:ring-rose-500/10' : 'border-slate-200 dark:border-slate-800'
                        } rounded-xl text-sm transition-all focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100`}
                      />
                      {errors.message && <p className="text-xs text-rose-500">{errors.message}</p>}
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full sm:w-auto px-6">
                        Send Message <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          </div>

        </div>
      </section>
    </PageWrapper>
  );
}
