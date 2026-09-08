import React, { useEffect, useState } from 'react';
import { Clock, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockTestService } from '@services/api.service';

const MockTest = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({ subject: 'DBMS', count: 30, duration_minutes: 30 });
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (timedOut = false) => {
    if (!test) return;
    const result = await mockTestService.submit(test.id, { answers: Object.entries(answers).map(([question, selected_answer]) => ({ question, selected_answer })), time_taken_sec: config.duration_minutes * 60 - seconds });
    localStorage.setItem('ai_buddy_mock_result', JSON.stringify(result.data || result));
    navigate(`/student/mock-test/${test.id}/results`, { replace: true, state: { timedOut } });
  };

  useEffect(() => {
    if (!test || seconds <= 0) return undefined;
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [test, seconds]);

  useEffect(() => {
    if (test && seconds === 0) submit(true).catch(() => setError('Auto-submit failed. Please retry.'));
  }, [seconds]);

  useEffect(() => {
    if (!test) return undefined;
    const preventBack = () => window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, [test]);

  const start = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try { const result = await mockTestService.generate(config); const data = result.data || result; setTest(data); setSeconds(config.duration_minutes * 60); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not generate the mock test.'); } finally { setLoading(false); }
  };

  if (!test) return <section className="mx-auto max-w-xl space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Assessment studio</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Mock test</h1><p className="mt-2 text-slate-600">Build a timed 30–50 question test from your course material.</p></div><form onSubmit={start} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel"><label className="block text-sm font-medium">Subject<input required value={config.subject} onChange={(event) => setConfig({ ...config, subject: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label><label className="block text-sm font-medium">Questions<select value={config.count} onChange={(event) => setConfig({ ...config, count: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="30">30</option><option value="40">40</option><option value="50">50</option></select></label><label className="block text-sm font-medium">Duration (minutes)<input type="number" min="10" max="120" value={config.duration_minutes} onChange={(event) => setConfig({ ...config, duration_minutes: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>{error && <p className="text-sm text-red-700">{error}</p>}<button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white">{loading && <LoaderCircle size={17} className="animate-spin" />} Start mock test</button></form></section>;

  const question = test.questions[Object.keys(answers).length] || test.questions[0];
  return <section className="space-y-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{test.subject}</p><h1 className="mt-2 text-2xl font-semibold text-ink">Mock test</h1></div><div className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 font-semibold text-amber-800"><Clock size={17} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</div></div><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel"><p className="text-sm text-slate-500">{Object.keys(answers).length + 1} / {test.questions.length}</p><h2 className="mt-4 text-xl font-semibold">{question.question_text}</h2><div className="mt-5 grid gap-3">{question.options.map((option) => <label key={option.label} className="flex gap-3 rounded-xl border border-slate-200 p-4"><input type="radio" name={question._id} checked={answers[question._id] === option.label} onChange={() => setAnswers({ ...answers, [question._id]: option.label })} />{option.label}. {option.text}</label>)}</div><div className="mt-6 flex justify-end"><button type="button" onClick={() => Object.keys(answers).length + 1 >= test.questions.length ? submit() : setAnswers({ ...answers, __cursor: Object.keys(answers).length + 1 })} className="rounded-xl bg-ink px-4 py-2.5 font-semibold text-white">{Object.keys(answers).length + 1 >= test.questions.length ? 'Submit test' : 'Next'}</button></div></article></section>;
};

export default MockTest;
