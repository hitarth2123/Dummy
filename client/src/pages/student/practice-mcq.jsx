import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, LoaderCircle, Sparkles, Trophy, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { llmService } from '@services/api.service';

const HISTORY_KEY = 'ai-buddy-practice-attempts';

const PracticeMCQ = () => {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get('topic') || 'Database normalization');
  const [questions, setQuestions] = useState([]);
  const [sources, setSources] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const question = questions[index];

  const generate = async (event) => {
    event.preventDefault();
    if (!topic.trim()) {
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    setQuestions([]);
    setResult(null);
    setScore(0);
    setIndex(0);
    setSelected('');
    setSubmitted(false);
    try {
      const response = await llmService.generateMcq({ topic, count: 5 });
      const data = response.data || response;
      setQuestions((data.questions || []).slice(0, 5));
      setSources(data.rag_sources || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not generate MCQs.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = () => {
    const nextScore = score + (selected === question.correct_answer ? 1 : 0);
    setScore(nextScore);
    setSubmitted(true);
  };

  const nextQuestion = () => {
    const finalQuestion = index >= questions.length - 1;
    if (finalQuestion) {
      const attempt = { topic, score, total: questions.length, marks: `${score}/${questions.length}`, date: new Date().toISOString() };
      const nextAttempts = [attempt, ...attempts].slice(0, 10);
      setAttempts(nextAttempts);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextAttempts));
      setResult(attempt);
      return;
    }
    setIndex((current) => current + 1);
    setSelected('');
    setSubmitted(false);
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Practice studio</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Practice MCQs</h1>
        <p className="mt-2 text-slate-600">Answer five questions, then review your score and previous attempts.</p>
      </div>

      <form onSubmit={generate} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-panel sm:flex-row">
        <input value={topic} onChange={(event) => setTopic(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600" placeholder="Topic" />
        <button disabled={loading || !topic.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
          {loading && <LoaderCircle size={16} className="animate-spin" />} Generate 5 questions
        </button>
      </form>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {result && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-panel">
          <Trophy className="mx-auto text-emerald-700" size={30} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">Practice complete</p>
          <h2 className="mt-1 text-3xl font-bold text-ink">{result.score} / {result.total} correct</h2>
          <p className="mt-1 text-sm text-emerald-800">Topic: {result.topic}</p>
          <button type="button" onClick={() => { setResult(null); setQuestions([]); }} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Try another set</button>
        </section>
      )}

      {question && !result && (
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-slate-500">Question {index + 1} of {questions.length}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-800">{question.difficulty || 'medium'}</span></div>
          <h2 className="mt-6 text-xl font-semibold text-ink">{question.question_text}</h2>
          <div className="mt-5 grid gap-3">{question.options.map((option) => <label key={option.label} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${selected === option.label ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="answer" value={option.label} checked={selected === option.label} onChange={(event) => setSelected(event.target.value)} disabled={submitted} className="mt-1 accent-teal-700" /><span><b>{option.label}.</b> {option.text}</span></label>)}</div>
          {submitted && <div className={`mt-5 rounded-xl p-4 text-sm ${selected === question.correct_answer ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{selected === question.correct_answer ? <CheckCircle2 className="mr-2 inline" size={18} /> : <XCircle className="mr-2 inline" size={18} />}{selected === question.correct_answer ? 'Correct.' : `Correct answer: ${question.correct_answer}.`} {question.explanation}</div>}
          <div className="mt-6 flex items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{sources.slice(0, 2).map((source) => <span key={source.chunk_id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Source: {source.source_document || source.chunk_id}</span>)}</div>{!submitted ? <button type="button" disabled={!selected} onClick={submitAnswer} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Check answer</button> : <button type="button" onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">{index === questions.length - 1 ? 'View score' : 'Next question'} <ChevronRight size={16} /></button>}</div>
        </article>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex items-center gap-2"><Trophy size={18} className="text-amber-600" /><h2 className="text-lg font-bold text-ink">Previous practice quizzes</h2></div>
        {attempts.length > 0 ? <div className="mt-4 divide-y divide-slate-100">{attempts.map((attempt) => <div key={`${attempt.date}-${attempt.topic}`} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold text-ink">{attempt.topic}</p><p className="text-xs text-slate-500">{new Date(attempt.date).toLocaleDateString()}</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">{attempt.marks}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Your attempted quizzes will appear here with their topic and marks.</p>}
      </section>

      {!question && !result && !loading && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><Sparkles className="mx-auto mb-3 text-amber-600" /><p>Choose a topic to begin.</p></div>}
    </section>
  );
};

export default PracticeMCQ;
