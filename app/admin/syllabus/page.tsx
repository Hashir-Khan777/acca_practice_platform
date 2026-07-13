'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useAdmin } from '../context';
import { Card, Button, Input, Select } from '@/components/UI';
import { Plus, ChevronRight } from 'lucide-react';
import { Subject, Topic } from '@/lib/store';

export default function AdminSyllabusPage() {
  const { store, updateStore, setSuccess, setError } = useAdmin();

  // CRUD State: Add Subject
  const [newSubCode, setNewSubCode] = React.useState('');
  const [newSubName, setNewSubName] = React.useState('');

  // CRUD State: Add Topic
  const [newTopicSubjectId, setNewTopicSubjectId] = React.useState('');
  const [newTopicName, setNewTopicName] = React.useState('');

  React.useEffect(() => {
    if (store && store.subjects.length > 0 && !newTopicSubjectId) {
      setNewTopicSubjectId(store.subjects[0].id);
    }
  }, [store, newTopicSubjectId]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode || !newSubName || !store) return;

    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUBJECT',
          code: newSubCode,
          name: newSubName,
          description: 'Syllabus content and practice questions managed by administrator.'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const newSub = result.data.subject;
        const updatedSubjects = [...store.subjects, newSub];
        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'SUBJECT_ADD', details: `Added Subject ${newSub.code}: ${newSub.name}`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        updateStore({ ...store, subjects: updatedSubjects, auditLogs: updatedLogs });
        setNewSubCode('');
        setNewSubName('');
        setSuccess('New Subject successfully registered.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to register Subject.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (e: any) {
      setError(e.message || 'Network error occurred.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicSubjectId || !newTopicName || !store) return;

    try {
      const res = await fetch('/api/admin/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TOPIC',
          subjectId: newTopicSubjectId,
          name: newTopicName,
          description: 'Syllabus guidelines and AI practice scenario pool.',
          difficulty: 'medium'
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const newTopic = result.data.topic;
        const updatedTopics = [...store.topics, newTopic];
        const updatedLogs = [
          { id: 'log-' + Date.now(), user: 'Admin', action: 'TOPIC_ADD', details: `Added Topic "${newTopic.name}" under subject ID ${newTopic.subjectId}`, timestamp: new Date().toISOString() },
          ...store.auditLogs
        ];

        updateStore({ ...store, topics: updatedTopics, auditLogs: updatedLogs });
        setNewTopicName('');
        setSuccess('New topic added under selected subject.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to register Topic.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (e: any) {
      setError(e.message || 'Network error occurred.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (!store) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Subjects & Syllabus Topics</h2>
        <p className="text-xs text-slate-500">Add course modules and define exam syllabus topics for active practicing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left col: Subject and Topic Creators */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Create Subject Form */}
          <Card className="p-6 text-left">
            <form onSubmit={handleAddSubject} className="flex flex-col gap-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Add Course Subject</span>
              <Input
                label="Subject Code"
                placeholder="e.g. TX"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                required
              />
              <Input
                label="Subject Name"
                placeholder="e.g. Taxation (UK)"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                required
              />
              <Button variant="primary" type="submit" size="sm">
                Register Subject <Plus className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </Card>

          {/* Create Topic Form */}
          <Card className="p-6 text-left">
            <form onSubmit={handleAddTopic} className="flex flex-col gap-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Add Syllabus Topic</span>
              <Select
                label="Parent Subject"
                options={store.subjects.map((s: any) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
                value={newTopicSubjectId}
                onChange={(e) => setNewTopicSubjectId(e.target.value)}
              />
              <Input
                label="Topic Name"
                placeholder="e.g. Capital Gains Tax Principles"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                required
              />
              <Button variant="primary" type="submit" size="sm">
                Register Topic <Plus className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Right col: Registry lists */}
        <div className="lg:col-span-7">
          <Card className="p-5 flex flex-col gap-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Active Subjects & Topics Registry</span>
            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto">
              {store.subjects.map((sub: Subject) => {
                const subTopics = store.topics.filter((t: any) => t.subjectId === sub.id);
                return (
                  <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col gap-2 border border-slate-100 dark:border-slate-850 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold font-mono text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-md">{sub.code}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{sub.name}</span>
                    </div>
                    <hr className="border-slate-100 dark:border-slate-800" />
                    <div className="flex flex-col gap-1.5">
                      {subTopics.map((top: Topic) => (
                        <div key={top.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <ChevronRight className="w-3.5 h-3.5 text-orange-500" />
                          <span>{top.name}</span>
                        </div>
                      ))}
                      {subTopics.length === 0 && (
                        <span className="text-[10px] italic text-slate-400">No topics registered yet under this course.</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
