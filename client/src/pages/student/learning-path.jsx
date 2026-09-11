import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  HelpCircle,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { studentService, learningPathService } from '@services/api.service';

const LearningPath = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(['DBMS', 'Operating Systems', 'Computer Networks', 'Data Structures', 'Software Engineering']);
  const [selectedSubject, setSelectedSubject] = useState('DBMS');
  const [path, setPath] = useState({ topics: [], overall_progress_pct: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // { [topicOrder]: 'read' | 'exercises' }

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

  const toggleExpand = (order) => {
    setExpandedTopic(expandedTopic === order ? null : order);
    if (!activeTab[order]) {
      setActiveTab((prev) => ({ ...prev, [order]: 'read' }));
    }
  };

  const topics = [...(path.topics || [])].sort((firstTopic, secondTopic) => (firstTopic.order || 0) - (secondTopic.order || 0));
  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const progressPct = path.overall_progress_pct || (topics.length ? Math.round((completedCount / topics.length) * 100) : 0);
  const nextTopic = topics.find((topic) => topic.status !== 'completed') || topics[0];
  const exerciseCount = topics.reduce((total, topic) => total + (topic.exercises?.length || 0), 0);
  const totalStudyMinutes = topics.reduce((total, topic) => total + (topic.estimated_minutes || 30), 0);

  const startTopic = async (topic, topicIndex) => {
    const previousTopic = topics[topicIndex - 1];
    if (previousTopic && previousTopic.status !== 'completed') {
      setMessage({ type: 'error', text: `Complete "${previousTopic.topic}" before starting this topic.` });
      return;
    }

    if (topic.status === 'in_progress') {
      navigate(`/student/learning-path/topic?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(topic.topic)}`);
      return;
    }

    try {
      const result = await studentService.completeLearningPathTopic({ subject: selectedSubject, topic: topic.topic, status: 'in_progress' });
      const updatedTopic = result.data || topic;
      setPath((currentPath) => ({
        ...currentPath,
        topics: currentPath.topics.map((item) => item.topic === topic.topic ? { ...item, ...updatedTopic } : item),
      }));
      navigate(`/student/learning-path/topic?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(topic.topic)}`);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not start this topic.' });
    }
  };

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

            {/* Learning approach info */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-teal-600" />
                <span>Read & Understand</span>
              </div>
              <span className="text-slate-300">→</span>
              <div className="flex items-center gap-1.5">
                <Lightbulb size={14} className="text-amber-500" />
                <span>Key Concepts</span>
              </div>
              <span className="text-slate-300">→</span>
              <div className="flex items-center gap-1.5">
                <ListChecks size={14} className="text-indigo-500" />
                <span>Practice & Exercises</span>
              </div>
              <span className="text-slate-300">→</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Move to Next Topic</span>
              </div>
            </div>
          </div>

          {/* Dashboard summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><BookOpen size={20} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Topics</p><p className="mt-1 text-xl font-bold text-ink">{topics.length}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><ListChecks size={20} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Exercises</p><p className="mt-1 text-xl font-bold text-ink">{exerciseCount}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><Clock size={20} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Study time</p><p className="mt-1 text-xl font-bold text-ink">{totalStudyMinutes} min</p></div>
            </div>
          </div>

          {nextTopic && (
            <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Continue learning</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{nextTopic.topic}</h2>
                  <p className="mt-1 text-sm text-slate-600">{nextTopic.description || 'Study this topic, complete its exercises, and practise with MCQs.'}</p>
                </div>
                <Link
                  to={`/student/learning-path/topic?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(nextTopic.topic)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  <BookOpen size={16} /> Open study page <ArrowRight size={15} />
                </Link>
              </div>
            </section>
          )}

          {/* Topics List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Study Roadmap — {selectedSubject}</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ordered by Priority</span>
            </div>

            {topics.map((topic, topicIndex) => {
              const isExpanded = expandedTopic === topic.order;
              const currentTab = activeTab[topic.order] || 'read';
              const hasContent = topic.reading_material || (topic.exercises && topic.exercises.length > 0);
              const topicStudyUrl = `/student/learning-path/topic?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(topic.topic)}`;
              const topicAction = topic.status === 'completed' ? 'Completed' : topic.status === 'in_progress' ? 'Resume' : 'Begin';

              return (
                <article
                  key={`${topic.order}-${topic.topic}`}
                  className="rounded-2xl border border-slate-200 bg-white shadow-panel transition hover:border-slate-300 overflow-hidden"
                >
                  {/* Topic Header */}
                  <div
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 cursor-pointer"
                    onClick={() => hasContent && toggleExpand(topic.order)}
                  >
                    <Link
                      to={topicStudyUrl}
                      className="flex min-w-0 items-start gap-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-50 text-base font-bold text-teal-700">
                        {topic.order || 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-ink text-base hover:text-teal-700">{topic.topic}</h3>
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
                          {topic.description || `${topic.subject || selectedSubject} · estimated ${topic.estimated_minutes || 30} minutes`}
                        </p>
                        {topic.key_concepts && topic.key_concepts.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {topic.key_concepts.slice(0, 4).map((concept, idx) => (
                              <span key={idx} className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                {concept}
                              </span>
                            ))}
                            {topic.key_concepts.length > 4 && (
                              <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                +{topic.key_concepts.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                          to={topicStudyUrl}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BookOpen size={14} />
                          <span>Study</span>
                      </Link>
                      <Link
                        to={`/student/practice-mcq?topic=${encodeURIComponent(topic.topic)}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HelpCircle size={14} />
                        <span>Practice MCQs</span>
                      </Link>
                      {topic.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 size={14} />
                          <span>{topicAction}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startTopic(topic, topicIndex); }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition"
                        >
                          <Play size={14} />
                          <span>{topicAction}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-6 pb-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-teal-700 transition-all duration-300"
                        style={{
                          width: `${
                            topic.status === 'completed' ? 100 : topic.status === 'in_progress' ? 50 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && hasContent && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {/* Tabs */}
                      <div className="flex border-b border-slate-200 px-6">
                        <button
                          type="button"
                          onClick={() => setActiveTab((prev) => ({ ...prev, [topic.order]: 'read' }))}
                          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                            currentTab === 'read'
                              ? 'border-teal-600 text-teal-700'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <BookOpen size={14} />
                          <span>Read & Understand</span>
                        </button>
                        {topic.exercises && topic.exercises.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab((prev) => ({ ...prev, [topic.order]: 'exercises' }))}
                            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                              currentTab === 'exercises'
                                ? 'border-indigo-600 text-indigo-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <ListChecks size={14} />
                            <span>Exercises ({topic.exercises.length})</span>
                          </button>
                        )}
                      </div>

                      {/* Tab Content */}
                      <div className="p-6">
                        {currentTab === 'read' && topic.reading_material && (
                          <div className="prose prose-sm prose-slate max-w-none">
                            <div
                              className="text-sm text-slate-700 leading-relaxed space-y-3"
                              dangerouslySetInnerHTML={{
                                __html: topic.reading_material
                                  .replace(/^### (.*$)/gm, '<h4 class="text-base font-bold text-ink mt-5 mb-2">$1</h4>')
                                  .replace(/^## (.*$)/gm, '<h3 class="text-lg font-bold text-ink mt-6 mb-2">$1</h3>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-teal-800">$1</code>')
                                  .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="rounded-xl bg-slate-900 p-4 text-xs text-emerald-300 font-mono overflow-x-auto my-3"><code>$2</code></pre>')
                                  .replace(/^\|(.+)\|$/gm, (match) => {
                                    const cells = match.split('|').filter(Boolean).map(c => c.trim());
                                    if (cells.every(c => /^[-:]+$/.test(c))) return '';
                                    const tag = match.includes('---') ? 'th' : 'td';
                                    return `<tr>${cells.map(c => `<${tag} class="border border-slate-200 px-3 py-2 text-xs">${c}</${tag}>`).join('')}</tr>`;
                                  })
                                  .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, '<table class="w-full border-collapse border border-slate-200 rounded-lg my-3">$&</table>')
                                  .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-sm text-slate-700 mb-1">$1</li>')
                                  .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal text-sm text-slate-700 mb-1">$2</li>')
                                  .replace(/\n\n/g, '<br/><br/>')
                                  .replace(/\n/g, '<br/>'),
                              }}
                            />

                            {/* Key Concepts */}
                            {topic.key_concepts && topic.key_concepts.length > 0 && (
                              <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-teal-800 mb-3">
                                  <Lightbulb size={16} />
                                  Key Concepts to Remember
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {topic.key_concepts.map((concept, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs text-teal-700">
                                      <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-teal-500" />
                                      <span>{concept}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {currentTab === 'exercises' && topic.exercises && (
                          <div className="space-y-4">
                            {topic.exercises.map((ex, idx) => (
                              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                                <div className="flex items-start gap-3">
                                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        ex.type === 'mcq' ? 'bg-purple-100 text-purple-700' :
                                        ex.type === 'practice' ? 'bg-blue-100 text-blue-700' :
                                        ex.type === 'design' ? 'bg-amber-100 text-amber-700' :
                                        ex.type === 'think' ? 'bg-pink-100 text-pink-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {ex.type || 'question'}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-ink leading-relaxed">{ex.question}</p>

                                    {/* MCQ Options */}
                                    {ex.type === 'mcq' && ex.options && (
                                      <div className="mt-3 space-y-2">
                                        {ex.options.map((opt, optIdx) => (
                                          <div key={optIdx} className="flex items-start gap-2 rounded-lg border border-slate-150 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                            <span className="font-bold text-slate-500">{String.fromCharCode(65 + optIdx)}.</span>
                                            <span>{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Hint */}
                                    {ex.hint && (
                                      <details className="mt-3 group">
                                        <summary className="cursor-pointer text-xs font-semibold text-teal-600 hover:text-teal-700 transition">
                                          💡 Show Hint
                                        </summary>
                                        <p className="mt-2 rounded-lg bg-teal-50 border border-teal-100 p-3 text-xs text-teal-700">
                                          {ex.hint}
                                        </p>
                                      </details>
                                    )}

                                    {/* Explanation (for MCQs) */}
                                    {ex.explanation && (
                                      <details className="mt-2 group">
                                        <summary className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">
                                          📖 Show Answer & Explanation
                                        </summary>
                                        <div className="mt-2 rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-700">
                                          {ex.correct !== undefined && (
                                            <p className="font-bold mb-1">
                                              Correct Answer: {String.fromCharCode(65 + ex.correct)}. {ex.options?.[ex.correct]}
                                            </p>
                                          )}
                                          <p>{ex.explanation}</p>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

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
