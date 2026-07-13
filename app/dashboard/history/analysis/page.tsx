'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { useDashboard } from '../../context';
import { Card, Button, Badge } from '@/components/UI';
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Question } from '@/lib/store';

export default function StudentQuizAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const quizIdParam = searchParams.get('quizId');
  const { store } = useDashboard();

  const [latestAttempt, setLatestAttempt] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (attemptIdParam || quizIdParam) {
      setLoading(true);
      
      // Try to find the attempt in store first if attemptIdParam is provided
      if (attemptIdParam && store) {
        const match = store.attempts.find((a: any) => a.id === attemptIdParam);
        if (match) {
          setLatestAttempt(match);
          setLoading(false);
          return;
        }
      }

      // Fetch from API directly
      const fetchUrl = quizIdParam 
        ? `/api/student/attempts?quizId=${quizIdParam}`
        : `/api/student/attempts?attemptId=${attemptIdParam}`;

      fetch(fetchUrl)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            if (quizIdParam && result.data.quiz) {
              const quiz = result.data.quiz;
              // Build a simulated attempt to review the quiz scenarios
              setLatestAttempt({
                id: quiz.id,
                quizId: quiz.id,
                subject: quiz.subject,
                topic: quiz.topic,
                difficulty: quiz.difficulty,
                date: quiz.createdAt,
                score: 0,
                totalQuestions: quiz.questions.length,
                percentage: 0,
                duration: 0,
                answers: {}, // No selected answers
                skipped: quiz.questions.length,
                correct: 0,
                wrong: 0,
                questions: quiz.questions,
                isQuizReviewOnly: true
              });
            } else if (result.data.attempt) {
              setLatestAttempt(result.data.attempt);
            }
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLatestAttempt(null);
      setLoading(false);
    }
  }, [attemptIdParam, quizIdParam, store]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-mono">Loading scorecard analysis...</p>
      </div>
    );
  }

  if (!latestAttempt) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-4">
        <p className="text-xs text-slate-400">Quiz details or attempt record not found.</p>
        <Button size="sm" onClick={() => router.push('/dashboard/history')}>
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-4xl text-left">
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
          onClick={() => router.push('/dashboard/history')}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to History
        </Button>
      </div>

      <div className={`p-6 border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left ${
        latestAttempt.isQuizReviewOnly
          ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white'
          : latestAttempt.percentage >= 50
            ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-950 dark:text-white'
            : 'bg-rose-500/10 border-rose-500/20 text-slate-950 dark:text-white'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full text-white ${
            latestAttempt.isQuizReviewOnly
              ? 'bg-slate-500'
              : latestAttempt.percentage >= 50 
                ? 'bg-emerald-500' 
                : 'bg-rose-500'
          }`}>
            {latestAttempt.isQuizReviewOnly 
              ? <CheckCircle className="w-6 h-6" />
              : latestAttempt.percentage >= 50 
                ? <CheckCircle className="w-6 h-6" /> 
                : <AlertTriangle className="w-6 h-6" />
            }
          </div>
          <div className="flex flex-col">
            <Badge variant={
              latestAttempt.isQuizReviewOnly 
                ? 'info' 
                : latestAttempt.percentage >= 50 
                  ? 'success' 
                  : 'danger'
            } className="w-fit mb-1">
              {latestAttempt.isQuizReviewOnly 
                ? 'Quiz Study Guide' 
                : latestAttempt.percentage >= 50 
                  ? 'Exam Passed' 
                  : 'Fail (Needs Practice)'}
            </Badge>
            <h2 className="text-lg font-extrabold leading-tight">
              {latestAttempt.isQuizReviewOnly
                ? `Answers & Explanations Reference`
                : latestAttempt.percentage >= 50 
                  ? 'Congratulations, you surpassed the ACCA threshold!' 
                  : 'A bit short this time. Tweak your concepts and retry.'}
            </h2>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Topic: {latestAttempt.subject} • {latestAttempt.topic}
            </span>
          </div>
        </div>
      </div>

      {!latestAttempt.isQuizReviewOnly && (
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
      )}

      <div className="flex flex-col gap-4 text-left mt-2">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold">
          {latestAttempt.isQuizReviewOnly ? 'ACCA Exam Practice Questions & Key answers' : 'Detailed Question-By-Question Analysis'}
        </span>
        
        {(() => {
          const fallbackQs = latestAttempt.questions || [];
          
          return fallbackQs.map((q: Question, idx: number) => {
            const userAns = latestAttempt.answers[q.id] || [];
            const isCorrect = !latestAttempt.isQuizReviewOnly && q.correct_answer.every((ans: string) => userAns.includes(ans)) && userAns.length === q.correct_answer.length;
            
            return (
              <Card key={idx} className={`p-6 border-l-4 ${
                latestAttempt.isQuizReviewOnly 
                  ? 'border-slate-300 dark:border-slate-700' 
                  : isCorrect 
                    ? 'border-emerald-500' 
                    : 'border-rose-500'
              } flex flex-col gap-4 text-left`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-400">Question {idx + 1}</span>
                  {!latestAttempt.isQuizReviewOnly && (
                    <Badge variant={isCorrect ? 'success' : 'danger'}>
                      {isCorrect ? 'Correct' : userAns.length === 0 ? 'Skipped' : 'Wrong'}
                    </Badge>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">{q.question}</p>

                <div className="flex flex-col gap-2.5 mt-1">
                  {q.options && q.options.map((opt: string, oIdx: number) => {
                    const isSelected = !latestAttempt.isQuizReviewOnly && userAns.includes(opt);
                    const isCorrectOpt = q.correct_answer.includes(opt);
                    
                    let optClass = "border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-slate-700 dark:text-slate-355";
                    if (latestAttempt.isQuizReviewOnly) {
                      if (isCorrectOpt) {
                        optClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
                      }
                    } else {
                      if (isSelected && isCorrectOpt) {
                        optClass = "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
                      } else if (isSelected && !isCorrectOpt) {
                        optClass = "border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-450 font-semibold";
                      } else if (!isSelected && isCorrectOpt) {
                        optClass = "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-medium";
                      }
                    }

                    return (
                      <div key={oIdx} className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${optClass}`}>
                        <span>{opt}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <Badge variant={isCorrectOpt ? "success" : "danger"} className="text-[8px] uppercase tracking-wider px-2 py-0.5 scale-90">
                              Your Choice
                            </Badge>
                          )}
                          {isCorrectOpt && (
                            <Badge variant="success" className="text-[8px] uppercase tracking-wider px-2 py-0.5 scale-90">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100/80 dark:border-slate-850 mt-1">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs block mb-1">Tutor Explanation & ACCA Standard:</span>
                  <p className="italic text-xs text-slate-500 leading-relaxed">{q.explanation}</p>
                </div>
              </Card>
            );
          });
        })()}
      </div>

    </motion.div>
  );
}
