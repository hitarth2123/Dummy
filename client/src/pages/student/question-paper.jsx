import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, FileText, HelpCircle, LoaderCircle } from 'lucide-react';
import { studentService } from '@services/api.service';

const QuestionPaper = () => {
  const [searchParams] = useSearchParams();
  const subject = searchParams.get('subject') || 'DBMS';
  const setName = searchParams.get('set') || '';
  const [questions, setQuestions] = useState([]);
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      studentService.getQuestionBank({ subject, set_name: setName, page: 1, include_answers: 'true' }),
      studentService.getQuestionSets({ subject }),
    ])
      .then(([questionResult, setsResult]) => {
        if (!active) return;
        const questionData = questionResult.data || questionResult;
        const sets = Array.isArray(setsResult) ? setsResult : (setsResult.data || []);
        setQuestions(questionData.questions || []);
        setPaper(sets.find((set) => set.set_name === setName) || { set_name: setName, subject, question_count: questionData.pagination?.total || 0 });
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load this question paper.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [subject, setName]);

  return (
    <section className="space-y-6">
      <Link to="/student/question-bank" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-on-primary-container">
        <ArrowLeft size={16} /> Back to question papers
      </Link>

      <header className="rounded-3xl bg-ink p-6 text-white shadow-panel sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary"><FileText size={15} /> Previous year paper</div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm text-outline">{paper?.year || 'Exam paper'} · {paper?.subject || subject}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{setName}</h1><p className="mt-2 text-sm text-outline">Attempt the questions from this paper and practise any topic you want to revise.</p></div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-on-surface"><BookOpen size={17} /> {paper?.question_count || questions.length} questions</span>
        </div>
      </header>

      {loading && <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>}
      {error && <div className="rounded-xl border border-error/20 bg-error-container/15 p-4 text-sm text-error">{error}</div>}

      {!loading && !error && <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-on-surface-variant"><span>{questions.length} questions in this paper</span><span>{paper?.year || subject}</span></div>
        {questions.map((question, index) => <article key={question._id || `${question.question_text}-${index}`} className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
          <div className="flex items-start gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-container/15 text-sm font-bold text-primary">{index + 1}</span><div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-surface-container-high px-2 py-1 text-xs font-medium text-on-surface-variant">{question.topic}</span><span className="rounded-md bg-secondary-container/15 px-2 py-1 text-xs font-semibold capitalize text-secondary">{question.difficulty || 'medium'}</span></div>
            <h2 className="mt-3 text-base font-semibold leading-relaxed text-on-surface">{question.question_text}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options?.map((option) => <div key={option.label} className="rounded-xl border border-surface-variant/40 bg-surface-container px-3.5 py-2.5 text-sm text-on-surface"><b className="text-on-surface">{option.label}.</b> {option.text}</div>)}</div>
            <details className="mt-4 rounded-xl border border-emerald-200 bg-secondary-container/10 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 size={16} /> Show solution</summary>
              <div className="mt-3 border-t border-emerald-200 pt-3 text-sm text-emerald-300"><p className="font-bold">Correct answer: {question.correct_answer || 'See explanation'}</p>{question.explanation && <p className="mt-2 leading-6">{question.explanation}</p>}</div>
            </details>
            <Link to={`/student/practice-mcq?topic=${encodeURIComponent(question.topic || subject)}`} className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><HelpCircle size={14} /> Practice this topic</Link>
          </div></div>
        </article>)}
        {questions.length === 0 && <div className="rounded-2xl border border-dashed border-surface-variant/50 bg-surface-container-low p-10 text-center text-sm text-on-surface-variant">No questions are available in this paper yet.</div>}
      </div>}
      <Link to="/student/question-bank" className="inline-flex items-center gap-2 rounded-xl border border-surface-variant/40 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface shadow-md hover:bg-surface-container"><ArrowLeft size={16} /> Back to question bank</Link>
    </section>
  );
};

export default QuestionPaper;
