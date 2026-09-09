import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Award, ChevronLeft, ChevronRight, Clock, History, LoaderCircle, Play, Send, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockTestService, studentService } from '@services/api.service';

/* ── TimerBar ─────────────────────────────────────────────────────────────── */
const TimerBar = ({ seconds, total }) => {
  const pct = Math.max(0, (seconds / total) * 100);
  const urgent = seconds <= 60;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-700/40">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear ${urgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${urgent ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-emerald-400'}`}>
        <Timer size={14} />
        {mins}:{String(secs).padStart(2, '0')}
      </div>
    </div>
  );
};

/* ── QuestionDots ─────────────────────────────────────────────────────────── */
const QuestionDots = ({ total, current, answers }) => (
  <div className="flex flex-wrap gap-1.5">
    {Array.from({ length: total }, (_, i) => {
      const answered = answers[i] !== undefined;
      const isCurrent = i === current;
      return (
        <div
          key={i}
          className={`grid h-7 w-7 place-items-center rounded-md text-xs font-semibold transition-all
            ${isCurrent ? 'scale-110 ring-2 ring-indigo-400 bg-indigo-500 text-white' : ''}
            ${!isCurrent && answered ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
            ${!isCurrent && !answered ? 'bg-slate-800 text-slate-500 border border-slate-700' : ''}`}
        >
          {i + 1}
        </div>
      );
    })}
  </div>
);

/* ── Config Screen ────────────────────────────────────────────────────────── */
const ConfigScreen = ({ onStart, loading, error, history, historyLoading, onViewResults }) => {
  const [config, setConfig] = useState({ subject: 'DBMS', count: 30, duration_minutes: 30 });
  const handleSubmit = (e) => { e.preventDefault(); onStart(config); };

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <Play size={28} className="text-white" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Assessment studio</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Mock Test</h1>
        <p className="mt-2 text-sm text-slate-400">Build a timed 30–50 question test or review your previous attempts.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Play size={18} className="text-indigo-400" />
            <span>Create New Mock Test</span>
          </h2>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Subject</span>
            <input
              required value={config.subject}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Questions</span>
              <select
                value={config.count}
                onChange={(e) => setConfig({ ...config, count: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              >
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="50">50</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Duration (min)</span>
              <input
                type="number" min="10" max="120"
                value={config.duration_minutes}
                onChange={(e) => setConfig({ ...config, duration_minutes: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              />
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:opacity-60"
          >
            {loading && <LoaderCircle size={18} className="animate-spin" />}
            {loading ? 'Generating test…' : 'Start mock test'}
          </button>
        </form>

        {/* Previous Attempts History */}
        <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History size={18} className="text-indigo-400" />
              <span>Previous Attempts</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {history?.length || 0} attempted
            </span>
          </div>

          {historyLoading ? (
            <div className="flex min-h-[220px] items-center justify-center text-slate-400">
              <LoaderCircle className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {history.map((item) => {
                const pct = item.score_pct || 0;
                const badgeColor = pct >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : pct >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                const mins = Math.floor((item.time_taken_sec || 0) / 60);
                const secs = (item.time_taken_sec || 0) % 60;
                const timeStr = `${mins}m ${secs}s`;
                const dateStr = item.submitted_at || item.createdAt ? new Date(item.submitted_at || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-800/50 p-3.5 transition hover:border-slate-700 hover:bg-slate-800"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{item.subject}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badgeColor}`}>
                          {item.score}/{item.total_questions} ({pct}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {timeStr}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewResults(item._id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-center p-6 text-slate-500">
              <Award size={32} className="mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No test attempts yet</p>
              <p className="text-xs text-slate-500 mt-1">Complete your first mock test to track your performance history here.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ── Main MockTest Component ──────────────────────────────────────────────── */
const MockTest = () => {
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const submitCalledRef = useRef(false);

  const question = test?.questions?.[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test?.questions?.length || 0;

  /* ── Fetch history ────────────────────────────────────────────────────── */
  useEffect(() => {
    studentService
      .getMockTestHistory()
      .then((res) => {
        setHistory(res.data || res || []);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const submit = useCallback(async (timedOut = false) => {
    if (!test || submitCalledRef.current) return;
    const testId = test.id || test._id;
    if (!testId) return;
    submitCalledRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selected_answer]) => ({ question: questionId, selected_answer })),
        time_taken_sec: totalSeconds - seconds,
      };
      const result = await mockTestService.submit(testId, payload);
      const resData = result.data || result;
      localStorage.setItem('ai_buddy_mock_result', JSON.stringify(resData));
      navigate(`/student/mock-test/${testId}/results`, { replace: true, state: { timedOut } });
    } catch (err) {
      setError('Submission failed. Please retry.');
      submitCalledRef.current = false;
      setSubmitting(false);
    }
  }, [test, answers, seconds, totalSeconds, navigate]);

  /* ── Timer ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!test) return undefined;
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test, submit]);

  /* ── Beforeunload guard ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!test) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [test]);

  /* ── Start test ───────────────────────────────────────────────────────── */
  const start = async (config) => {
    setLoading(true); setError('');
    try {
      const result = await mockTestService.generate(config);
      const data = result.data || result;
      setTest(data);
      const totalSec = (config.duration_minutes || 30) * 60;
      setTotalSeconds(totalSec);
      setSeconds(totalSec);
      setCurrentIndex(0);
      setAnswers({});
      submitCalledRef.current = false;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate the mock test.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (id) => {
    navigate(`/student/mock-test/${id}/results`);
  };

  /* ── Config screen ────────────────────────────────────────────────────── */
  if (!test) {
    return (
      <ConfigScreen
        onStart={start}
        loading={loading}
        error={error}
        history={history}
        historyLoading={historyLoading}
        onViewResults={handleViewResults}
      />
    );
  }

  /* ── Test screen ──────────────────────────────────────────────────────── */
  return (
    <section className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">{test.subject}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Mock Test</h1>
        </div>
        <div className="w-full max-w-xs">
          <TimerBar seconds={seconds} total={totalSeconds} />
        </div>
      </div>

      {/* Question dots */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3">
        <QuestionDots total={totalQuestions} current={currentIndex} answers={answers} />
      </div>

      {/* Main question card */}
      {question && (
        <article className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-xl backdrop-blur space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-indigo-400">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>

          <h2 className="text-lg font-bold text-white leading-relaxed">
            {question.question_text || `Question ${currentIndex + 1}`}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {(question.options || []).map((opt) => {
              const selected = answers[question._id] === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [question._id]: opt.label })}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                    selected
                      ? 'border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500'
                      : 'border-slate-700/60 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      selected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {opt.label}
                    </span>
                    <span>{opt.text}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => submit(false)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 disabled:opacity-60"
              >
                {submitting && <LoaderCircle size={16} className="animate-spin" />}
                <Send size={16} /> Submit test
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
        </article>
      )}
    </section>
  );
};

export default MockTest;
