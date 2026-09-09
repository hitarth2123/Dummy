import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Filter,
  HelpCircle,
  LoaderCircle,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { studentService, learningPathService } from '@services/api.service';

const LearningPath = () => {
  const [subjects, setSubjects] = useState(['DBMS', 'Operating Systems', 'Computer Networks', 'Data Structures', 'Software Engineering']);
  const [selectedSubject, setSelectedSubject] = useState('DBMS');
  const [path, setPath] = useState({ topics: [], overall_progress_pct: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch available subjects
  useEffect(() => {
    studentService
      .getSubjects()
      .then((res) => {
        const list = res.data || res;
        if (Array.isArray(list) && list.length > 0) {
          setSubjects(list);
          if (!list.includes(selectedSubject)) {
            setSelectedSubject(list[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchPath = async (subjectToFetch) => {
    setLoading(true);
    try {
      const result = await studentService.getLearningPath({ subject: subjectToFetch || selectedSubject });
      const data = result.data || result;
      setPath(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not load learning path.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPath(selectedSubject);
  }, [selectedSubject]);

  const handleGeneratePath = async () => {
    setGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await learningPathService.generate({ subject: selectedSubject, manual_refresh: true });
      const data = res.data || res;
      setPath(data);
      setMessage({ type: 'success', text: `Your learning path for ${selectedSubject} has been refreshed based on latest topic mastery!` });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not generate learning path at this time.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setGenerating(false);
    }
  };

  const topics = path.topics || [];
  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const progressPct = path.overall_progress_pct || (topics.length ? Math.round((completedCount / topics.length) * 100) : 0);

  return (
    <section className="space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <Sparkles size={14} />
            <span>Adaptive Study Plan</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Learning Path</h1>
          <p className="mt-1 text-sm text-slate-600">
            Select a subject to build and track a personalized topic roadmap based on course material and test performance.
          </p>
        </div>

        {/* Subject Filter & Generator Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-ink shadow-sm outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            >
              {subjects.map((subj) => (
                <option key={subj} value={subj}>
                  Subject: {subj}
                </option>
              ))}
            </select>
            <Filter size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={handleGeneratePath}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60"
          >
            {generating ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                <span>Generating AI Path...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Generate AI Path for {selectedSubject}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-100'
              : 'bg-emerald-50 text-emerald-800 border-emerald-100'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      ) : (
        <>
          {/* Progress Summary Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">{path.subject || selectedSubject} Roadmap Progress</h2>
                  <p className="text-xs text-slate-500">
                    {completedCount} of {topics.length} topics mastered
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-teal-700">{progressPct}%</span>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Recommended Focus Areas — {selectedSubject}</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ordered by Priority</span>
            </div>

            {topics.map((topic) => (
              <article
                key={`${topic.order}-${topic.topic}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-50 text-base font-bold text-teal-700">
                      {topic.order || 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-ink text-base">{topic.topic}</h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            topic.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : topic.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {topic.status ? topic.status.replace('_', ' ') : 'pending'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {topic.subject || selectedSubject} · estimated 30 minutes practice
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      to={`/student/practice-mcq?topic=${encodeURIComponent(topic.topic)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
                    >
                      <HelpCircle size={14} />
                      <span>Practice MCQs</span>
                    </Link>
                    <Link
                      to="/student/mock-test"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition"
                    >
                      <Play size={14} />
                      <span>Test Topic</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-700 transition-all duration-300"
                    style={{
                      width: `${
                        topic.status === 'completed' ? 100 : topic.status === 'in_progress' ? 50 : 0
                      }%`,
                    }}
                  />
                </div>
              </article>
            ))}

            {topics.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                <BookOpen className="mx-auto mb-3 text-teal-700" size={32} />
                <h3 className="text-lg font-semibold text-ink">No learning path for {selectedSubject} yet</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Click &quot;Generate AI Path for {selectedSubject}&quot; to create a custom study plan for this subject.
                </p>
                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGeneratePath}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {generating ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>Generate AI Path for {selectedSubject}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default LearningPath;
