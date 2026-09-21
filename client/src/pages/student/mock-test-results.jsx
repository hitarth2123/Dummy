import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  LoaderCircle,
  Share2,
  Target,
  TrendingDown,
  XCircle,
} from 'lucide-react';
import { studentService } from '@services/api.service';

/* ── Score Donut ───────────────────────────────────────────────────────────── */
const ScoreDonut = ({ score }) => {
  const radius = 70;
  const stroke = 10;
  const circ = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const timer = setTimeout(() => setOffset(circ - (score / 100) * circ), 100);
    return () => clearTimeout(timer);
  }, [score, circ]);

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative grid place-items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black text-white">{score}%</span>
        <span className="text-xs font-medium text-slate-400">Final Score</span>
      </div>
    </div>
  );
};

/* ── Topic Progress Bar ────────────────────────────────────────────────────── */
const TopicBar = ({ topic, score_pct, correct, total }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score_pct), 200);
    return () => clearTimeout(t);
  }, [score_pct]);

  const barColor = score_pct >= 80 ? 'bg-emerald-500' : score_pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score_pct >= 80 ? 'text-emerald-400' : score_pct >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-300">{topic}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{correct}/{total}</span>
          <span className={`font-bold ${textColor}`}>{score_pct}%</span>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

/* ── Main MockTestResults Page ─────────────────────────────────────────────── */
const MockTestResults = () => {
  const { id } = useParams();
  const location = useLocation();
  const timedOut = location.state?.timedOut;

  const [result, setResult] = useState(() => {
    const stored = localStorage.getItem('ai_buddy_mock_result');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!id || parsed.id === id || parsed._id === id) return parsed;
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(!result);
  const [copied, setCopied] = useState(false);

  // Fetch results from server if missing or direct URL access
  useEffect(() => {
    if (id) {
      studentService
        .getMockTestResults(id)
        .then((res) => setResult(res.data || res))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const previewLink = useMemo(() => {
    const testId = id || result?._id || result?.id;
    return testId ? `${window.location.origin}/student/mock-test/${testId}/results` : '';
  }, [id, result]);

  const copyPreviewLink = () => {
    if (!previewLink) return;
    navigator.clipboard.writeText(previewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = result?.score_pct || 0;
  const breakdown = result?.topic_breakdown || [];
  const questionsList = result?.questions || [];
  const weakTopics = useMemo(() => breakdown.filter((t) => t.score_pct < 60), [breakdown]);
  const weakTopicNames = weakTopics.map((t) => t.topic).join(',');

  /* ── Report Download ───────────────────────────────────────────────────── */
  const downloadReport = () => {
    const lines = [
      '========================================================================',
      '                     AI BUDDY — MOCK TEST REPORT                        ',
      '========================================================================',
      '',
      `Date:           ${new Date(result?.submitted_at || Date.now()).toLocaleString()}`,
      `Test ID:        ${id || result?._id || result?.id || 'N/A'}`,
      `Subject:        ${result?.subject || 'Course Assessment'}`,
      `Score:          ${result?.score || 0} / ${result?.total_questions || 0} (${score}%)`,
      `Time Taken:     ${Math.floor((result?.time_taken_sec || 0) / 60)}m ${(result?.time_taken_sec || 0) % 60}s`,
      `Preview Link:   ${previewLink}`,
      '',
      '------------------------------------------------------------------------',
      ' TOPIC BREAKDOWN',
      '------------------------------------------------------------------------',
      ...breakdown.map(
        (t) =>
          `  • ${t.topic.padEnd(30)} ${t.correct}/${t.total} (${t.score_pct}%) ${
            t.score_pct < 60 ? '[NEEDS PRACTICE]' : '[PASSED]'
          }`
      ),
      '',
      '------------------------------------------------------------------------',
      ' DETAILED QUESTION REVIEW',
      '------------------------------------------------------------------------',
      '',
      ...questionsList.map((item, idx) => {
        const q = item.question || item;
        const qText = q.question_text || `Question ${idx + 1}`;
        const selected = item.selected_answer;
        const correct = item.correct_answer || q.correct_answer;
        const isCorrect = item.is_correct || selected === correct;

        const optionsText = (q.options || [])
          .map((opt) => {
            const isOptSelected = selected === opt.label;
            const isOptCorrect = correct === opt.label;
            let marker = '  ';
            if (isOptSelected && isOptCorrect) marker = '✓ [YOUR CORRECT SELECTION]';
            else if (isOptSelected && !isOptCorrect) marker = '✗ [YOUR SELECTION - INCORRECT]';
            else if (isOptCorrect && !isOptSelected) marker = '★ [CORRECT ANSWER]';
            return `     [${opt.label}] ${opt.text} ${marker}`;
          })
          .join('\n');

        return [
          `Q${idx + 1}. ${qText}`,
          `    Topic: ${q.topic || 'General'} | Difficulty: ${q.difficulty || 'medium'}`,
          `    Status: ${isCorrect ? '✓ CORRECT' : selected ? '✗ INCORRECT' : '⚪ SKIPPED'}`,
          optionsText,
          !isCorrect && q.explanation ? `    Explanation: ${q.explanation}` : '',
          '------------------------------------------------------------------------',
        ].join('\n');
      }),
      '',
      '========================================================================',
      ' Generated by AI Buddy Learning Portal',
      '========================================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-test-${result?.subject || 'report'}-${id || 'results'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white">
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!result) {
    return (
      <section className="grid min-h-[50vh] place-items-center">
        <div className="text-center text-slate-400">
          <BarChart3 className="mx-auto mb-3" size={36} />
          <h2 className="text-xl font-bold text-white">No Results Found</h2>
          <p className="mt-1 text-sm text-slate-400">Complete a mock test to view your performance report.</p>
          <Link
            to="/student/mock-test"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-500"
          >
            <span>Take a Mock Test</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* Header & Preview Link */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">Assessment Report</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Mock Test Results</h1>
          <p className="mt-1 text-sm text-slate-400">
            {result.subject} · Submitted on {new Date(result.submitted_at || Date.now()).toLocaleDateString()}
          </p>
        </div>

        {/* Copy Preview Link Button */}
        {previewLink && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyPreviewLink}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-teal-300 transition hover:bg-slate-700 hover:text-white"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Preview Link Copied!' : 'Copy Preview Link'}</span>
            </button>
          </div>
        )}
      </div>

      {timedOut && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          <Target size={18} />
          <span>Time expired during the test — answers submitted automatically.</span>
        </div>
      )}

      {/* Score Donut + Topic Breakdown */}
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center shadow-xl">
          <ScoreDonut score={score} />
          <div>
            <p className="text-sm font-semibold text-slate-300">
              {result.score} / {result.total_questions} Correct
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold">
              <Award
                size={14}
                className={score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}
              />
              <span className={score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                {score >= 80 ? 'Excellent Mastery' : score >= 60 ? 'Good Progress' : 'Needs Practice'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-teal-400" />
            <h2 className="text-lg font-bold text-white">Topic Performance Breakdown</h2>
          </div>
          <div className="space-y-4">
            {breakdown.map((item) => (
              <TopicBar key={item.topic} {...item} />
            ))}
          </div>
        </div>
      </div>

      {/* Download & Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={downloadReport}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-600"
        >
          <Download size={16} />
          <span>Download Test Report</span>
        </button>

        {weakTopicNames && (
          <Link
            to={`/student/practice-mcq?topic=${encodeURIComponent(weakTopicNames)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <BookOpen size={16} />
            <span>Practice Weak Topics</span>
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Detailed Question Review Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Detailed Question Review</h2>
          <span className="text-xs text-slate-400">{questionsList.length} Questions Evaluated</span>
        </div>

        <div className="space-y-4">
          {questionsList.map((item, idx) => {
            const q = item.question || item;
            const selected = item.selected_answer;
            const correct = item.correct_answer || q.correct_answer;
            const isCorrect = item.is_correct || selected === correct;
            const options = q.options || [];

            return (
              <article
                key={q._id || idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                      Q{idx + 1}
                    </span>
                    {q.topic && (
                      <span className="rounded-lg bg-teal-950/60 px-2.5 py-1 text-xs font-medium text-teal-300 border border-teal-800/40">
                        {q.topic}
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selected
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 size={14} /> Correct
                      </>
                    ) : selected ? (
                      <>
                        <XCircle size={14} /> Incorrect
                      </>
                    ) : (
                      'Skipped'
                    )}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white leading-relaxed">
                  {q.question_text || `Question ${idx + 1}`}
                </h3>

                {/* Options List */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {options.map((opt) => {
                    const isSelected = selected === opt.label;
                    const isCorrectOption = correct === opt.label;

                    let styleClasses = 'border-slate-800 bg-slate-800/40 text-slate-300';
                    let badge = null;

                    if (isCorrectOption) {
                      // Correct option is ALWAYS highlighted in GREEN
                      styleClasses = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-semibold ring-1 ring-emerald-500/40';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 size={14} /> {isSelected ? 'Correct Choice' : 'Correct Answer'}
                        </span>
                      );
                    } else if (isSelected && !isCorrectOption) {
                      // User's wrong selection is highlighted in RED
                      styleClasses = 'border-rose-500/60 bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400">
                          <XCircle size={14} /> Your Selection
                        </span>
                      );
                    }

                    return (
                      <div
                        key={opt.label}
                        className={`flex items-start justify-between rounded-xl border p-3.5 text-sm transition ${styleClasses}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-bold">{opt.label}.</span>
                          <span>{opt.text}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation (shown if incorrect or skipped) */}
                {!isCorrect && q.explanation && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
                    <b className="text-slate-300 font-semibold block mb-1">Explanation:</b>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
};

export default MockTestResults;
