'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Button, Card, Badge, Input, Select, Progress, Dialog } from '@/components/UI';
import {
  BookOpen, Clock, Sparkles, Bookmark, ChevronRight, Check, AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react';
import { updateStreakOnPractice, MOCK_AI_QUESTIONS, Quiz, Attempt, Question } from '@/lib/store';

export default function StudentPracticeQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');

  const { store, updateStore, notifications, setNotifications, setShowUpgradeModal } = useDashboard();

  // Practice Quiz Form State
  const [quizSubject, setQuizSubject] = React.useState('');
  const [quizTopic, setQuizTopic] = React.useState('');
  const [quizDifficulty, setQuizDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionsCount, setQuizQuestionsCount] = React.useState(3);
  const [quizQuestionType, setQuizQuestionType] = React.useState<'MCQ' | 'Input' | 'Excel'>('MCQ');
  const [quizTimerOption, setQuizTimerOption] = React.useState('yes');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [genProgress, setGenProgress] = React.useState(0);
  const [genMessage, setGenMessage] = React.useState('');

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = React.useState<Quiz | null>(null);
  const [activeQuizAnswers, setActiveQuizAnswers] = React.useState<{ [qId: number]: string[] }>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = React.useState(0);
  const [quizSecondsRemaining, setQuizSecondsRemaining] = React.useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = React.useState<number[]>([]);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [quizStartTime, setQuizStartTime] = React.useState<Date | null>(null);

  // Result State
  const [latestAttempt, setLatestAttempt] = React.useState<Attempt | null>(null);

  React.useEffect(() => {
    if (store) {
      const recommendedTopic = searchParams.get('topic');
      if (recommendedTopic) {
        const topicMatch = store.topics.find((t: any) => t.name.toLowerCase() === recommendedTopic.toLowerCase());
        if (topicMatch) {
          const subjectMatch = store.subjects.find((s: any) => s.id === topicMatch.subjectId);
          if (subjectMatch) {
            setQuizSubject(subjectMatch.name);
            setQuizTopic(topicMatch.name);
            return;
          }
        }
      }

      // Default fallback select values
      if (store.subjects.length > 0) {
        setQuizSubject(store.subjects[0].name);
        const subTopics = store.topics.filter((t: any) => t.subjectId === store.subjects[0].id);
        if (subTopics.length > 0) {
          setQuizTopic(subTopics[0].name);
        }
      }
    }
  }, [store, searchParams]);

  // Load a past attempt if specified in URL query parameters
  React.useEffect(() => {
    if (attemptIdParam && store) {
      const match = store.attempts.find((a: any) => a.id === attemptIdParam);
      if (match) {
        setLatestAttempt(match);
        setActiveQuiz(null);
      }
    } else {
      setLatestAttempt(null);
    }
  }, [attemptIdParam, store]);

  // Active Quiz Timed Engine Tick
  React.useEffect(() => {
    let interval: any = null;
    if (activeQuiz && quizSecondsRemaining > 0) {
      interval = setInterval(() => {
        setQuizSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizSecondsRemaining]);

  if (!store) return null;

  const updateSubjectSelector = (subjectName: string) => {
    setQuizSubject(subjectName);
    const selectedSub = store.subjects.find((s: any) => s.name === subjectName);
    if (selectedSub) {
      const filtered = store.topics.filter((t: any) => t.subjectId === selectedSub.id);
      if (filtered.length > 0) {
        setQuizTopic(filtered[0].name);
      } else {
        setQuizTopic('');
      }
    }
  };

  const handleGenerateQuiz = async () => {
    // Enforce free tier limitations
    const today = new Date().toISOString().split('T')[0];
    const todayAttempts = store.attempts.filter((a: any) => a.date && a.date.startsWith(today)).length;

    if (store.currentUser.plan === 'free' && todayAttempts >= 5) {
      alert("You have reached your free daily limit of 5 quizzes. Please upgrade to Full-Pass Premium for unlimited AI generations!");
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setGenProgress(10);
    setGenMessage('Connecting to Google Gemini API servers...');

    const progressInterval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
    }, 400);

    try {
      setGenMessage('Formatting prompts aligned with syllabus & standards...');
      
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: quizSubject,
          topic: quizTopic,
          difficulty: quizDifficulty,
          numQuestions: quizQuestionsCount,
          questionType: quizQuestionType
        })
      });

      clearInterval(progressInterval);
      setGenProgress(95);
      setGenMessage('Parsing validated question schemas...');

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.errors?.[0] || 'AI API generated invalid output.');
      }

      setGenProgress(100);
      setGenMessage('Quiz successfully synchronized!');

      setTimeout(() => {
        const newQuiz: Quiz = {
          id: 'quiz-' + Date.now(),
          title: `Syllabus Test: ${quizTopic}`,
          subject: quizSubject,
          topic: quizTopic,
          difficulty: quizDifficulty,
          type: quizQuestionType,
          questions: result.data.questions,
          createdAt: new Date().toISOString(),
          generatedBy: 'AI'
        };

        setIsGenerating(false);
        setGenProgress(0);
        setGenMessage('');
        
        startPracticeSession(newQuiz);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      setIsGenerating(false);
      setGenProgress(0);
      setGenMessage('');
      alert(err.message || 'AI generator failure. Please retry.');
    }
  };

  const startPracticeSession = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setBookmarkedQuestions([]);
    
    const answersObj: any = {};
    quiz.questions.forEach(q => {
      answersObj[q.id] = [];
    });
    setActiveQuizAnswers(answersObj);

    if (quizTimerOption === 'yes') {
      const minutes = quiz.questions.length * 2.5;
      setQuizSecondsRemaining(Math.round(minutes * 60));
    } else {
      setQuizSecondsRemaining(0);
    }

    setQuizStartTime(new Date());
    setLatestAttempt(null);
  };

  const toggleBookmark = (qId: number) => {
    if (bookmarkedQuestions.includes(qId)) {
      setBookmarkedQuestions(bookmarkedQuestions.filter(id => id !== qId));
    } else {
      setBookmarkedQuestions([...bookmarkedQuestions, qId]);
    }
  };

  const handleAnswerSelect = (qId: number, option: string) => {
    setActiveQuizAnswers({
      ...activeQuizAnswers,
      [qId]: [option]
    });
  };

  const handleSubmitQuiz = (timeExpired = false) => {
    if (!activeQuiz) return;
    setShowSubmitModal(false);

    const endTime = new Date();
    const duration = quizStartTime ? Math.round((endTime.getTime() - quizStartTime.getTime()) / 1000) : 120;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    activeQuiz.questions.forEach(q => {
      const userAns = activeQuizAnswers[q.id] || [];
      if (userAns.length === 0) {
        skippedCount++;
      } else {
        const isCorrect = q.correct_answer.some(ans => userAns.includes(ans));
        if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const percentage = Math.round((correctCount / activeQuiz.questions.length) * 100);

    const newAttempt: Attempt = {
      id: 'att-' + Date.now(),
      quizId: activeQuiz.id,
      subject: activeQuiz.subject,
      topic: activeQuiz.topic,
      difficulty: activeQuiz.difficulty,
      date: new Date().toISOString(),
      score: correctCount,
      totalQuestions: activeQuiz.questions.length,
      percentage: percentage,
      duration: duration,
      answers: activeQuizAnswers,
      skipped: skippedCount,
      correct: correctCount,
      wrong: wrongCount
    };

    const updatedStreak = updateStreakOnPractice(store.streak);
    
    const updatedCurrentUser = {
      ...store.currentUser,
      totalQuizzes: store.currentUser.totalQuizzes + 1
    };

    const updatedUsers = store.users.map((u: any) => u.id === store.currentUser.id ? updatedCurrentUser : u);
    const updatedAttempts = [newAttempt, ...store.attempts];
    
    const updatedLogs = [
      { id: 'log-' + Date.now(), user: store.currentUser.email, action: 'QUIZ_SUBMIT', details: `Completed ${activeQuiz.topic} quiz. Score: ${percentage}%`, timestamp: new Date().toISOString() },
      ...store.auditLogs
    ];

    const updatedStore = {
      ...store,
      currentUser: updatedCurrentUser,
      streak: updatedStreak,
      users: updatedUsers,
      attempts: updatedAttempts,
      auditLogs: updatedLogs
    };

    updateStore(updatedStore);
    setLatestAttempt(newAttempt);
    setActiveQuiz(null);

    // Dispatch streak notifications
    if (updatedStreak.currentStreak > store.streak.currentStreak) {
      setNotifications([
        { id: 'n-streak-' + Date.now(), title: 'Streak Booster!', desc: `Awesome! You maintained your daily study streak. It is now at ${updatedStreak.currentStreak} days.`, date: 'Just now', read: false },
        ...notifications
      ]);
    }
  };

  return (
    <div className="w-full">
      {/* 1. API LOADER ANIMATION SCREEN */}
      {isGenerating && (
        <Card className="p-8 flex flex-col items-center text-center justify-center gap-6 bg-slate-950 border border-slate-800 text-white rounded-3xl min-h-[400px]">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-base text-emerald-400 animate-pulse">{genMessage}</h3>
            <p className="text-xs text-slate-400">Compiling syllabus concepts & establishing secure API connections...</p>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>Sync Progression</span>
              <span>{genProgress}%</span>
            </div>
            <Progress value={genProgress} />
          </div>
        </Card>
      )}

      {/* 2. QUIZ CONFIGURATION FORM */}
      {!isGenerating && !activeQuiz && !latestAttempt && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-2xl">
          <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Practice Generator</h2>
            <p className="text-xs text-slate-500">Configure quiz constraints to invoke Gemini and construct challenging test question arrays.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleGenerateQuiz(); }} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="ACCA Course Subject"
                options={store.subjects.map((s: any) => ({ value: s.name, label: `${s.code} - ${s.name}` }))}
                value={quizSubject}
                onChange={(e) => updateSubjectSelector(e.target.value)}
              />

              <Select
                label="Exam Syllabus Topic"
                options={store.topics
                  .filter((t: any) => {
                    const matchedSub = store.subjects.find((s: any) => s.name === quizSubject);
                    return matchedSub ? t.subjectId === matchedSub.id : true;
                  })
                  .map((t: any) => ({ value: t.name, label: t.name }))}
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Difficulty Level"
                options={[
                  { value: 'easy', label: 'Easy (Knowledge Foundations)' },
                  { value: 'medium', label: 'Medium (Applied Scenarios)' },
                  { value: 'hard', label: 'Hard (Complex Professional Case)' }
                ]}
                value={quizDifficulty}
                onChange={(e: any) => setQuizDifficulty(e.target.value)}
              />

              <Select
                label="Answering Format"
                options={[
                  { value: 'MCQ', label: 'MCQ (Multiple Choice)' },
                  { value: 'Input', label: 'Numeric/Text Input' },
                  { value: 'Excel', label: 'Computational Spreadsheet' }
                ]}
                value={quizQuestionType}
                onChange={(e: any) => setQuizQuestionType(e.target.value)}
              />

              <Select
                label="Number of Questions"
                options={[
                  { value: '3', label: '3 Questions (Quick Practice)' },
                  { value: '5', label: '5 Questions (Standard Review)' },
                  { value: '10', label: '10 Questions (Mock Exam)' }
                ]}
                value={quizQuestionsCount.toString()}
                onChange={(e) => setQuizQuestionsCount(parseInt(e.target.value))}
              />
            </div>

            <Select
              label="Apply Timed Exam Environment (2.5 mins per question)?"
              options={[
                { value: 'yes', label: 'Yes, apply constraints' },
                { value: 'no', label: 'No timer constraints (Relaxed study)' }
              ]}
              value={quizTimerOption}
              onChange={(e) => setQuizTimerOption(e.target.value)}
            />

            <div className="mt-4 flex flex-col gap-3">
              <Button variant="primary" type="submit" size="lg" className="w-full shadow-lg">
                <Sparkles className="w-5 h-5 mr-2" /> Generate Unlimited AI Quiz Now
              </Button>
              <p className="text-[11px] text-center text-slate-400 font-mono">
                Calls Google Gemini 3.5 Flash server-side. Output is automatically validated against structural schemas.
              </p>
            </div>
          </form>
        </motion.div>
      )}

      {/* 3. ACTIVE QUIZ TIMED ENGINE */}
      {!isGenerating && activeQuiz && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
            <div className="flex flex-col text-left gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Active Practice Session</span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{activeQuiz.title}</h2>
            </div>

            <div className="flex items-center gap-4">
              {quizTimerOption === 'yes' && (
                <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono text-sm font-extrabold rounded-xl flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>
                    Time Left: {Math.floor(quizSecondsRemaining / 60)}:{(quizSecondsRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <Button variant="primary" size="sm" onClick={() => setShowSubmitModal(true)}>
                Submit Answers
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}</span>
              <span>{Math.round(((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100)}% Complete</span>
            </div>
            <Progress value={((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <Card className="lg:col-span-8 p-6 flex flex-col gap-6 text-left">
              <div className="flex items-center justify-between">
                <Badge variant="info">{activeQuiz.difficulty.toUpperCase()} DIFFICULTY</Badge>
                
                <button
                  onClick={() => toggleBookmark(activeQuiz.questions[currentQuestionIdx].id)}
                  className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    bookmarkedQuestions.includes(activeQuiz.questions[currentQuestionIdx].id)
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  {bookmarkedQuestions.includes(activeQuiz.questions[currentQuestionIdx].id) ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-mono tracking-widest text-emerald-500 font-extrabold">ACCA EXAM SCENARIO:</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                  {activeQuiz.questions[currentQuestionIdx].question}
                </p>
              </div>

              <hr className="border-slate-100 dark:border-slate-800/60" />

              <div className="flex flex-col gap-3">
                {activeQuiz.questions[currentQuestionIdx].options.map((opt, oIdx) => {
                  const isSelected = activeQuizAnswers[activeQuiz.questions[currentQuestionIdx].id]?.includes(opt);
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleAnswerSelect(activeQuiz.questions[currentQuestionIdx].id, opt)}
                      className={`p-4 border rounded-2xl flex items-start gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-950 dark:text-white'
                          : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        isSelected ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                      <span className="text-xs font-semibold">{opt}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIdx === 0}
                >
                  Previous
                </Button>
                
                <Button
                  variant="primary"
                  onClick={() => {
                    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
                      setCurrentQuestionIdx(prev => prev + 1);
                    } else {
                      setShowSubmitModal(true);
                    }
                  }}
                >
                  {currentQuestionIdx < activeQuiz.questions.length - 1 ? 'Next Question' : 'Review & Submit'}
                </Button>
              </div>
            </Card>

            <Card className="lg:col-span-4 p-5 flex flex-col gap-5 text-left">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-extrabold">Question Palette</span>
              
              <div className="grid grid-cols-5 gap-2">
                {activeQuiz.questions.map((q, idx) => {
                  const isAnswered = (activeQuizAnswers[q.id] || []).length > 0;
                  const isBookmarked = bookmarkedQuestions.includes(q.id);
                  const isCurrent = idx === currentQuestionIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-10 rounded-xl font-bold font-mono text-xs border flex items-center justify-center transition-all relative cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : isAnswered
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 font-extrabold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                      {isBookmarked && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              <hr className="border-slate-50 dark:border-slate-850" />

              <div className="flex flex-col gap-2.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-emerald-500 rounded-md" />
                  <span>Active Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md" />
                  <span>Answered Solved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-md" />
                  <span>Unattempted Empty</span>
                </div>
              </div>
            </Card>
          </div>

          <Dialog isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Answers Confirmation">
            <div className="flex flex-col gap-4 text-left py-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to finalize and submit your answers? You have answered{' '}
                <span className="font-bold text-emerald-500">
                  {Object.values(activeQuizAnswers).filter(v => v.length > 0).length}
                </span>{' '}
                out of <span className="font-bold">{activeQuiz.questions.length}</span> questions.
              </p>
              <div className="flex gap-3 justify-end mt-2">
                <Button variant="outline" size="sm" onClick={() => setShowSubmitModal(false)}>
                  Go Back & Review
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleSubmitQuiz(false)}>
                  Submit Now
                </Button>
              </div>
            </div>
          </Dialog>
        </motion.div>
      )}

      {/* 4. QUIZ RESULTS ANALYSIS PRESENTATION */}
      {!isGenerating && !activeQuiz && latestAttempt && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-4xl">
          <div className={`p-6 border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left ${
            latestAttempt.percentage >= 50
              ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-950 dark:text-white'
              : 'bg-rose-500/10 border-rose-500/20 text-slate-950 dark:text-white'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full text-white ${latestAttempt.percentage >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {latestAttempt.percentage >= 50 ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div className="flex flex-col">
                <Badge variant={latestAttempt.percentage >= 50 ? 'success' : 'danger'} className="w-fit mb-1">
                  {latestAttempt.percentage >= 50 ? 'Exam Passed' : 'Fail (Needs Practice)'}
                </Badge>
                <h2 className="text-lg font-extrabold leading-tight">
                  {latestAttempt.percentage >= 50 ? 'Congratulations, you surpassed the ACCA threshold!' : 'A bit short this time. Tweak your concepts and retry.'}
                </h2>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                if (attemptIdParam) {
                  router.push('/dashboard/practice');
                } else {
                  setLatestAttempt(null);
                }
              }}>
                {attemptIdParam ? 'Go to Generator' : 'Practice Again'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Final Score</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1">{latestAttempt.percentage}%</span>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Correct Answers</span>
              <span className="text-2xl font-extrabold text-emerald-500 block mt-1">{latestAttempt.correct}</span>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Wrong / Skipped</span>
              <span className="text-2xl font-extrabold text-rose-500 block mt-1">{latestAttempt.wrong} / {latestAttempt.skipped}</span>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">Time Taken</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1">
                {Math.floor(latestAttempt.duration / 60)}:{(latestAttempt.duration % 60).toString().padStart(2, '0')}
              </span>
            </Card>
          </div>

          <div className="flex flex-col gap-4 text-left mt-2">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold">Detailed Question-By-Question Analysis</span>
            
            {(() => {
              const subjectKey = latestAttempt.subject.toLowerCase().includes("audit") ? "sub-aa" : "sub-fr";
              const fallbackQs = MOCK_AI_QUESTIONS[subjectKey] || MOCK_AI_QUESTIONS['sub-fr'];
              
              return fallbackQs.map((q: Question, idx: number) => {
                const userAns = latestAttempt.answers[q.id] || [];
                const isCorrect = q.correct_answer.some(ans => userAns.includes(ans));
                
                return (
                  <Card key={idx} className={`p-6 border-l-4 ${isCorrect ? 'border-emerald-500' : 'border-rose-500'} flex flex-col gap-4 text-left`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-400">Question {idx + 1}</span>
                      <Badge variant={isCorrect ? 'success' : 'danger'}>
                        {isCorrect ? 'Correct' : userAns.length === 0 ? 'Skipped' : 'Wrong'}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{q.question}</p>

                    <div className="flex flex-col gap-2.5 text-xs text-slate-500">
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">Your Answer:</span>
                        <p className={`p-2 rounded-lg mt-1 ${isCorrect ? 'bg-emerald-500/5 text-emerald-600 font-bold' : 'bg-rose-500/5 text-rose-500'}`}>
                          {userAns.join(', ') || '(No Answer Submitted)'}
                        </p>
                      </div>
                      
                      {!isCorrect && (
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">Correct Answer:</span>
                          <p className="p-2 bg-emerald-500/5 text-emerald-600 rounded-lg font-bold mt-1">
                            {q.correct_answer.join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 mt-1">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Tutor Explanation & Accounting Guidelines:</span>
                        <p className="italic leading-relaxed">{q.explanation}</p>
                      </div>
                    </div>
                  </Card>
                );
              });
            })()}
          </div>
        </motion.div>
      )}
    </div>
  );
}
