'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { useDashboard } from '../context';
import { Button, Card, Badge, Input, Select, Progress, Dialog } from '@/components/UI';
import {
  BookOpen, Clock, Sparkles, Bookmark, ChevronRight, Check
} from 'lucide-react';
import { Quiz } from '@/lib/store';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function StudentPracticeQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');

  const { store, updateStore, notifications, setNotifications, setShowUpgradeModal } = useDashboard();

  // Practice Quiz Form State
  const [quizSubject, setQuizSubject] = React.useState('');
  const [quizTopic, setQuizTopic] = React.useState('');
  const [quizDifficulty, setQuizDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionsCount, setQuizQuestionsCount] = React.useState(10);
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



  React.useEffect(() => {
    if (store) {
      const recommendedTopic = searchParams.get('topic');
      if (recommendedTopic) {
        const topicMatch = store.topics.find((t: any) => t.name.toLowerCase() === recommendedTopic.toLowerCase());
        if (topicMatch) {
          const subjectMatch = store.subjects.find((s: any) => s.id === topicMatch.subjectId);
          if (subjectMatch) {
            setQuizSubject(subjectMatch.code);
            setQuizTopic(topicMatch.name);
            return;
          }
        }
      }

      // Default fallback select values
      if (store.subjects.length > 0) {
        setQuizSubject(store.subjects[0].code);
        const subTopics = store.topics.filter((t: any) => t.subjectId === store.subjects[0].id);
        if (subTopics.length > 0) {
          setQuizTopic(subTopics[0].name);
        }
      }
    }
  }, [store, searchParams]);



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

  const updateSubjectSelector = (subjectCode: string) => {
    setQuizSubject(subjectCode);
    const selectedSub = store.subjects.find((s: any) => s.code === subjectCode);
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

    // if (store.currentUser.plan === 'free' && todayAttempts >= 5) {
    //   alert("You have reached your free daily limit of 5 quizzes. Please upgrade to Full-Pass Premium for unlimited AI generations!");
    //   setShowUpgradeModal(true);
    //   return;
    // }

    setIsGenerating(true);
    setGenProgress(10);
    setGenMessage('Connecting to ACCA AI servers...');

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

      if (result.data.quizId) {
        const newQuiz: Quiz = {
          id: result.data.quizId,
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
      }

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

  const handleSubmitQuiz = async (timeExpired = false) => {
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

    try {
      const res = await fetch('/api/student/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          subject: activeQuiz.subject,
          topic: activeQuiz.topic,
          difficulty: activeQuiz.difficulty,
          score: correctCount,
          totalQuestions: activeQuiz.questions.length,
          percentage: percentage,
          duration: duration,
          answers: activeQuizAnswers,
          skipped: skippedCount,
          correct: correctCount,
          wrong: wrongCount
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setActiveQuiz(null);
        localStorage.removeItem('acca_active_quiz_session');
        const savedAttempt = result.data.attempt;
        const updatedStreak = result.data.streak;

        router.push(`/dashboard/history/analysis?quizId=${savedAttempt.quizId}&attemptId=${savedAttempt.id}`);
        
        const updatedCurrentUser = {
          ...store.currentUser,
          totalQuizzes: store.currentUser.totalQuizzes + 1
        };

        const updatedUsers = store.users.map((u: any) => u.id === store.currentUser.id ? updatedCurrentUser : u);
        const updatedAttempts = [savedAttempt, ...store.attempts];
        
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

        // Dispatch streak notifications
        if (updatedStreak.currentStreak > store.streak.currentStreak) {
          setNotifications([
            { id: 'n-streak-' + Date.now(), title: 'Streak Booster!', desc: `Awesome! You maintained your daily study streak. It is now at ${updatedStreak.currentStreak} days.`, date: 'Just now', read: false },
            ...notifications
          ]);
        }
      }
    } catch (err: any) {
      console.log(err, 'err')
    }
  };

  // Restore active quiz session from localStorage on mount
  React.useEffect(() => {
    const rawSession = localStorage.getItem('acca_active_quiz_session');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session.activeQuiz) {
          let adjustedSeconds = session.quizSecondsRemaining;
          if (session.quizTimerOption === 'yes' && session.savedAt) {
            const elapsed = Math.round((new Date().getTime() - new Date(session.savedAt).getTime()) / 1000);
            adjustedSeconds = Math.max(0, session.quizSecondsRemaining - elapsed);
          }
          
          if (session.quizTimerOption === 'yes' && adjustedSeconds <= 0) {
            setActiveQuiz(session.activeQuiz);
            setActiveQuizAnswers(session.activeQuizAnswers || {});
            setQuizSecondsRemaining(0);
            setTimeout(() => {
              handleSubmitQuiz(true);
            }, 100);
            return;
          }

          setActiveQuiz(session.activeQuiz);
          setActiveQuizAnswers(session.activeQuizAnswers || {});
          setCurrentQuestionIdx(session.currentQuestionIdx || 0);
          setQuizSecondsRemaining(adjustedSeconds);
          setQuizStartTime(session.quizStartTime ? new Date(session.quizStartTime) : new Date());
          setBookmarkedQuestions(session.bookmarkedQuestions || []);
          setQuizTimerOption(session.quizTimerOption || 'yes');
        }
      } catch (e) {
        console.error('Failed to restore active quiz session:', e);
      }
    }
  }, []);

  // Save active quiz session to localStorage whenever states change
  React.useEffect(() => {
    if (activeQuiz) {
      const sessionData = {
        activeQuiz,
        activeQuizAnswers,
        currentQuestionIdx,
        quizSecondsRemaining,
        quizStartTime: quizStartTime ? quizStartTime.toISOString() : null,
        bookmarkedQuestions,
        quizTimerOption,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('acca_active_quiz_session', JSON.stringify(sessionData));
    }
  }, [activeQuiz, activeQuizAnswers, currentQuestionIdx, quizSecondsRemaining, quizStartTime, bookmarkedQuestions, quizTimerOption]);

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
      {!isGenerating && !activeQuiz && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-2xl">
          <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-900 pb-4">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI Practice Generator</h2>
            <p className="text-xs text-slate-500">Configure quiz constraints to invoke AI and construct challenging test question arrays.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleGenerateQuiz(); }} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="ACCA Course Subject"
                options={store.subjects.map((s: any) => ({ value: s.code, label: `${s.code} - ${s.name}` }))}
                value={quizSubject}
                onChange={(e) => updateSubjectSelector(e.target.value)}
              />

              <Select
                label="Exam Syllabus Topic"
                options={[{ value: 'all', label: 'All' }, ...store.topics
                  .filter((t: any) => {
                    const matchedSub = store.subjects.find((s: any) => s.code === quizSubject);
                    return matchedSub ? t.subjectId === matchedSub.id : true;
                  })
                  .map((t: any) => ({ value: t.name, label: t.name }))]}
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* <Select
                label="Answering Format"
                options={[
                  { value: 'MCQ', label: 'MCQ (Multiple Choice)' },
                  { value: 'Input', label: 'Numeric/Text Input' },
                  { value: 'Excel', label: 'Computational Spreadsheet' }
                ]}
                value={quizQuestionType}
                onChange={(e: any) => setQuizQuestionType(e.target.value)}
              /> */}

              <Select
                label="Number of Questions"
                options={[
                  { value: '10', label: '10 Questions (Warm-up)' },
                  { value: '20', label: '20 Questions (Daily Routine)' },
                  { value: '30', label: '30 Questions (Strengthen Mode)' },
                  { value: '40', label: '40 Questions (Challenge Mode)' },
                  { value: '50', label: '50 Questions (Mini Mock Exam)' },
                  { value: '100', label: '100 Questions (Grand Mock Exam)' }
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
                Calls AI server-side. Output is automatically validated against structural schemas.
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
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                  <Markdown remarkPlugins={[remarkGfm]}>{activeQuiz.questions[currentQuestionIdx].question}</Markdown>
                </p>
              </div>

              <hr className="border-slate-100 dark:border-slate-800/60" />

              {activeQuiz.questions[currentQuestionIdx].options.length > 0 ?
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
              : <Input
                  label="Type your answer here..."
                  type="default"
                  value={activeQuizAnswers[activeQuiz.questions[currentQuestionIdx].id]}
                  onChange={(e: any) => handleAnswerSelect(activeQuiz.questions[currentQuestionIdx].id, e.target.value.toString())}
                  required
                />}

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
    </div>
  );
}
