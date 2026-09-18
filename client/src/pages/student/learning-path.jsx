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
import ProgressOrb from '@components/three/ProgressOrb';

const LearningPath = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(['DBMS', 'Operating Systems', 'Computer Networks', 'Data Structures', 'Software Engineering']);
  const [selectedSubject, setSelectedSubject] = useState('DBMS');
  const [curriculumCatalog, setCurriculumCatalog] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(5);
  const [selectedTopic, setSelectedTopic] = useState('');
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
    studentService.getCurriculum().then((res) => {
      const curriculum = res.data || res;
      setCurriculumCatalog(curriculum?.catalog || []);
      setSelectedSemester(curriculum?.semester || curriculum?.catalog?.[0]?.number || 5);
      const firstSubject = curriculum?.catalog?.[0]?.specializations?.[0]?.subjects?.[0]?.name;
      if (firstSubject && !(curriculum?.catalog || []).some((semester) => (semester.specializations || []).some((specialization) => (specialization.subjects || []).some((subject) => subject.name === selectedSubject)))) {
        setSelectedSubject(firstSubject);
      }
    }).catch(() => {});
  }, []);

  const fallbackCatalog = [{ number: 5, specializations: [{ name: 'Common Core', subjects: [
    { name: 'DBMS', topics: ['Database Fundamentals', 'ER Modeling', 'Normalization', 'SQL', 'Transactions and ACID'] },
    { name: 'Operating Systems', topics: ['Processes and Threads', 'CPU Scheduling', 'Deadlocks', 'Memory Management'] },
    { name: 'Computer Networks', topics: ['OSI Model', 'TCP/IP', 'Routing', 'Network Security'] },
  ] }] }];
  const activeCatalog = curriculumCatalog.length ? curriculumCatalog : fallbackCatalog;
  const semesterOptions = activeCatalog.map((semester) => semester.number);
  const activeSemester = activeCatalog.find((semester) => semester.number === Number(selectedSemester)) || activeCatalog[0];
  const semesterSubjects = (activeSemester?.specializations || [])
    .flatMap((specialization) => specialization.subjects || [])
    .filter((subject, index, all) => all.findIndex((item) => item.name === subject.name) === index);
  const availableSubjects = semesterSubjects.length ? semesterSubjects : subjects.map((name) => ({ name, topics: [] }));
  const activeSubject = availableSubjects.find((subject) => subject.name === selectedSubject) || availableSubjects[0];
  const availableTopics = activeSubject?.topics || [];

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
      const res = await learningPathService.generate({ subject: selectedSubject, topic: selectedTopic, manual_refresh: true });
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
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
              <Sparkles size={12} className="text-secondary" />
              <span className="text-primary-fixed">Personalized Roadmap</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">Path</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-on-surface-variant">
              Select a subject to build and track a personalized topic roadmap based on course material and test performance.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-4">
            <label className="text-left">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">1. Semester</span>
              <select value={selectedSemester} onChange={(event) => { const semester = Number(event.target.value); const first = activeCatalog.find((item) => item.number === semester)?.specializations?.[0]?.subjects?.[0]?.name || ''; setSelectedSemester(semester); setSelectedSubject(first); setSelectedTopic(''); }} className="w-full rounded-xl border border-surface-variant/50 bg-surface-container-low px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary">
                {semesterOptions.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
              </select>
            </label>
            <label className="text-left">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">2. Subject</span>
              <select value={selectedSubject} onChange={(event) => { setSelectedSubject(event.target.value); setSelectedTopic(''); }} className="w-full rounded-xl border border-surface-variant/50 bg-surface-container-low px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary">
                {availableSubjects.map((subject) => <option key={subject.name} value={subject.name}>{subject.name}</option>)}
              </select>
            </label>
            <label className="text-left">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">3. Topic</span>
              <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)} disabled={!availableTopics.length} className="w-full rounded-xl border border-surface-variant/50 bg-surface-container-low px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">All topics</option>
                {availableTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
            </label>
            <button type="button" disabled={generating} onClick={handleGeneratePath} className="self-end inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-primary-fixed hover:shadow-glow disabled:opacity-60">
              {generating ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>{generating ? 'Generating...' : 'Generate Path'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium border ${
            message.type === 'error'
              ? 'bg-error-container/15 text-error border-error/20'
              : 'bg-secondary-container/10 text-emerald-300 border-emerald-100'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Progress Summary Card */}
          <div className="rounded-3xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-container/15 text-primary">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">{path.subject || selectedSubject} Roadmap Progress</h2>
                  <p className="text-xs text-on-surface-variant">
                    {completedCount} of {topics.length} topics mastered
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <ProgressOrb progress={progressPct} />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-primary">{progressPct}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-primary-container to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Learning approach info */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-primary" />
                <span>Read & Understand</span>
              </div>
              <span className="text-outline">→</span>
              <div className="flex items-center gap-1.5">
                <Lightbulb size={14} className="text-amber-500" />
                <span>Key Concepts</span>
              </div>
              <span className="text-outline">→</span>
              <div className="flex items-center gap-1.5">
                <ListChecks size={14} className="text-indigo-500" />
                <span>Practice & Exercises</span>
              </div>
              <span className="text-outline">→</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Move to Next Topic</span>
              </div>
            </div>
          </div>

          {/* Dashboard summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-container/15 text-primary"><BookOpen size={20} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-outline">Topics</p><p className="mt-1 text-xl font-bold text-on-surface">{topics.length}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><ListChecks size={20} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-outline">Exercises</p><p className="mt-1 text-xl font-bold text-on-surface">{exerciseCount}</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary-container/15 text-secondary"><Clock size={20} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-outline">Study time</p><p className="mt-1 text-xl font-bold text-on-surface">{totalStudyMinutes} min</p></div>
            </div>
          </div>

          {nextTopic && (
            <section className="rounded-2xl border border-primary/30 bg-primary-container/15 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Continue learning</p>
                  <h2 className="mt-1 text-xl font-bold text-on-surface">{nextTopic.topic}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">{nextTopic.description || 'Study this topic, complete its exercises, and practise with MCQs.'}</p>
                </div>
                <Link
                  to={`/student/learning-path/topic?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(nextTopic.topic)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white hover:bg-inverse-primary"
                >
                  <BookOpen size={16} /> Open study page <ArrowRight size={15} />
                </Link>
              </div>
            </section>
          )}

          {/* Topics List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Study Roadmap — {selectedSubject}</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">Ordered by Priority</span>
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
                  className="rounded-2xl border border-surface-variant/40 bg-surface-container-low shadow-panel transition hover:border-surface-variant/50 overflow-hidden"
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
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container/15 text-base font-bold text-primary">
                        {topic.order || 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-on-surface text-base hover:text-primary">{topic.topic}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              topic.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-300'
                                : topic.status === 'in_progress'
                                ? 'bg-secondary-container/20 text-amber-300'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {topic.status ? topic.status.replace('_', ' ') : 'pending'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {topic.description || `${topic.subject || selectedSubject} · estimated ${topic.estimated_minutes || 30} minutes`}
                        </p>
                        {topic.key_concepts && topic.key_concepts.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {topic.key_concepts.slice(0, 4).map((concept, idx) => (
                              <span key={idx} className="rounded-md bg-surface-container border border-surface-variant/40 px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
                                {concept}
                              </span>
                            ))}
                            {topic.key_concepts.length > 4 && (
                              <span className="rounded-md bg-surface-container border border-surface-variant/40 px-2 py-0.5 text-[10px] font-medium text-outline">
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
                          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BookOpen size={14} />
                          <span>Study</span>
                      </Link>
                      <Link
                        to={`/student/practice-mcq?topic=${encodeURIComponent(topic.topic)}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary-container/15 px-4 py-2 text-xs font-semibold text-on-primary-container hover:bg-primary-container/20 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HelpCircle size={14} />
                        <span>Practice MCQs</span>
                      </Link>
                      {topic.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-300">
                          <CheckCircle2 size={14} />
                          <span>{topicAction}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startTopic(topic, topicIndex); }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-white hover:bg-inverse-primary transition"
                        >
                          <Play size={14} />
                          <span>{topicAction}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-6 pb-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-2 rounded-full bg-primary-container transition-all duration-300"
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
                    <div className="border-t border-surface-variant/20 bg-surface-container/50">
                      {/* Tabs */}
                      <div className="flex border-b border-surface-variant/40 px-6">
                        <button
                          type="button"
                          onClick={() => setActiveTab((prev) => ({ ...prev, [topic.order]: 'read' }))}
                          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                            currentTab === 'read'
                              ? 'border-teal-600 text-primary'
                              : 'border-transparent text-on-surface-variant hover:text-on-surface'
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
                                ? 'border-indigo-600 text-primary'
                                : 'border-transparent text-on-surface-variant hover:text-on-surface'
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
                          <div className="markdown-body max-w-none">
                            <div
                              className="text-sm text-on-surface leading-relaxed space-y-3"
                              dangerouslySetInnerHTML={{
                                __html: topic.reading_material
                                  .replace(/^### (.*$)/gm, '<h4 class="text-base font-bold text-on-surface mt-5 mb-2">$1</h4>')
                                  .replace(/^## (.*$)/gm, '<h3 class="text-lg font-bold text-on-surface mt-6 mb-2">$1</h3>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-on-surface">$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-container-high px-1.5 py-0.5 text-xs font-mono text-on-primary-container">$1</code>')
                                  .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="rounded-xl bg-surface-container-lowest p-4 text-xs text-emerald-300 font-mono overflow-x-auto my-3"><code>$2</code></pre>')
                                  .replace(/^\|(.+)\|$/gm, (match) => {
                                    const cells = match.split('|').filter(Boolean).map(c => c.trim());
                                    if (cells.every(c => /^[-:]+$/.test(c))) return '';
                                    const tag = match.includes('---') ? 'th' : 'td';
                                    return `<tr>${cells.map(c => `<${tag} class="border border-surface-variant/40 px-3 py-2 text-xs">${c}</${tag}>`).join('')}</tr>`;
                                  })
                                  .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, '<table class="w-full border-collapse border border-surface-variant/40 rounded-lg my-3">$&</table>')
                                  .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-sm text-on-surface mb-1">$1</li>')
                                  .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal text-sm text-on-surface mb-1">$2</li>')
                                  .replace(/\n\n/g, '<br/><br/>')
                                  .replace(/\n/g, '<br/>'),
                              }}
                            />

                            {/* Key Concepts */}
                            {topic.key_concepts && topic.key_concepts.length > 0 && (
                              <div className="mt-6 rounded-xl border border-primary/30 bg-primary-container/15/50 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-on-primary-container mb-3">
                                  <Lightbulb size={16} />
                                  Key Concepts to Remember
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {topic.key_concepts.map((concept, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs text-primary">
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
                              <div key={idx} className="rounded-xl border border-surface-variant/40 bg-surface-container-low p-5 space-y-3">
                                <div className="flex items-start gap-3">
                                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        ex.type === 'mcq' ? 'bg-purple-100 text-tertiary' :
                                        ex.type === 'practice' ? 'bg-blue-100 text-secondary' :
                                        ex.type === 'design' ? 'bg-secondary-container/20 text-secondary' :
                                        ex.type === 'think' ? 'bg-pink-100 text-pink-700' :
                                        'bg-surface-container-high text-on-surface-variant'
                                      }`}>
                                        {ex.type || 'question'}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-on-surface leading-relaxed">{ex.question}</p>

                                    {/* MCQ Options */}
                                    {ex.type === 'mcq' && ex.options && (
                                      <div className="mt-3 space-y-2">
                                        {ex.options.map((opt, optIdx) => (
                                          <div key={optIdx} className="flex items-start gap-2 rounded-lg border border-surface-variant/30 bg-surface-container px-3 py-2 text-xs text-on-surface">
                                            <span className="font-bold text-on-surface-variant">{String.fromCharCode(65 + optIdx)}.</span>
                                            <span>{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Hint */}
                                    {ex.hint && (
                                      <details className="mt-3 group">
                                        <summary className="cursor-pointer text-xs font-semibold text-primary hover:text-primary transition">
                                          💡 Show Hint
                                        </summary>
                                        <p className="mt-2 rounded-lg bg-primary-container/15 border border-primary/20 p-3 text-xs text-primary">
                                          {ex.hint}
                                        </p>
                                      </details>
                                    )}

                                    {/* Explanation (for MCQs) */}
                                    {ex.explanation && (
                                      <details className="mt-2 group">
                                        <summary className="cursor-pointer text-xs font-semibold text-primary hover:text-primary transition">
                                          📖 Show Answer & Explanation
                                        </summary>
                                        <div className="mt-2 rounded-lg bg-primary/10 border border-indigo-100 p-3 text-xs text-primary">
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
              <div className="rounded-3xl border border-dashed border-surface-variant/50 bg-surface-container-low p-12 text-center text-on-surface-variant">
                <BookOpen className="mx-auto mb-3 text-primary" size={32} />
                <h3 className="text-lg font-semibold text-on-surface">No learning path for {selectedSubject} yet</h3>
                <p className="mt-1 text-sm text-on-surface-variant max-w-md mx-auto">
                  Click &quot;Generate AI Path for {selectedSubject}&quot; to create a custom study plan for this subject.
                </p>
                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGeneratePath}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 text-sm font-semibold text-white hover:bg-inverse-primary disabled:opacity-60"
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
