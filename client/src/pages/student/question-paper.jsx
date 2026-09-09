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
      <Link to="/student/question-bank" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800">
        <ArrowLeft size={16} /> Back to question papers
      </Link>

      <header className="rounded-3xl bg-ink p-6 text-white shadow-panel sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300"><FileText size={15} /> Previous year paper</div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm text-slate-300">{paper?.year || 'Exam paper'} · {paper?.subject || subject}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{setName}</h1><p className="mt-2 text-sm text-slate-300">Attempt the questions from this paper and practise any topic you want to revise.</p></div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-sm font-bold text-ink"><BookOpen size={17} /> {paper?.question_count || questions.length} questions</span>
        </div>
      </header>

      {loading && <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-teal-700" /></div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500"><span>{questions.length} questions in this paper</span><span>{paper?.year || subject}</span></div>
        {questions.map((question, index) => <article key={question._id || `${question.question_text}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex items-start gap-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">{index + 1}</span><div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{question.topic}</span><span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold capitalize text-amber-700">{question.difficulty || 'medium'}</span></div>
            <h2 className="mt-3 text-base font-semibold leading-relaxed text-ink">{question.question_text}</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options?.map((option) => <div key={option.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700"><b className="text-ink">{option.label}.</b> {option.text}</div>)}</div>
            <details className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 size={16} /> Show solution</summary>
              <div className="mt-3 border-t border-emerald-200 pt-3 text-sm text-emerald-900"><p className="font-bold">Correct answer: {question.correct_answer || 'See explanation'}</p>{question.explanation && <p className="mt-2 leading-6">{question.explanation}</p>}</div>
            </details>
            <Link to={`/student/practice-mcq?topic=${encodeURIComponent(question.topic || subject)}`} className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"><HelpCircle size={14} /> Practice this topic</Link>
          </div></div>
        </article>)}
        {questions.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No questions are available in this paper yet.</div>}
      </div>}
      <Link to="/student/question-bank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><ArrowLeft size={16} /> Back to question bank</Link>
    </section>
  );
};

export default QuestionPaper;
