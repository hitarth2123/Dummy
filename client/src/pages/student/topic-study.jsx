import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, HelpCircle, Lightbulb, ListChecks, LoaderCircle, Sparkles } from 'lucide-react';
import { studentService } from '@services/api.service';

const formatReadingMaterial = (material) => material
  .replace(/^### (.*$)/gm, '<h3 class="mt-6 mb-2 text-lg font-bold text-ink">$1</h3>')
  .replace(/^## (.*$)/gm, '<h2 class="mt-6 mb-3 text-xl font-bold text-ink">$1</h2>')
  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
  .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-teal-800">$1</code>')
  .replace(/^- (.*$)/gm, '<li class="ml-5 list-disc mb-1">$1</li>')
  .replace(/\n\n/g, '<br/><br/>')
  .replace(/\n/g, '<br/>');

const TopicStudy = () => {
  const [searchParams] = useSearchParams();
  const subject = searchParams.get('subject') || 'DBMS';
  const topicName = searchParams.get('topic') || '';
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    studentService.getLearningPath({ subject })
      .then((result) => {
        if (!active) return;
        const data = result.data || result;
        const foundTopic = (data.topics || []).find((item) => item.topic === topicName);
        if (foundTopic) setTopic(foundTopic);
        else setError('This topic is not available in the selected learning path.');
      })
      .catch(() => { if (active) setError('Could not load this study topic.'); })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [subject, topicName]);

  const handleDone = async () => {
    if (!topic || topic.status === 'completed') return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await studentService.completeLearningPathTopic({ subject, topic: topic.topic });
      setTopic((current) => ({ ...current, ...(result.data || {}) }));
      setSuccess('Topic marked as completed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this topic.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-teal-700" /></div>;
  if (error || !topic) return <section className="space-y-4"><Link to="/student/learning-path" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"><ArrowLeft size={16} /> Back to learning path</Link><div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{error || 'Topic not found.'}</div></section>;

  const practiceLink = `/student/practice-mcq?topic=${encodeURIComponent(topic.topic)}`;

  return (
    <section className="space-y-6">
      <Link to={`/student/learning-path?subject=${encodeURIComponent(subject)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"><ArrowLeft size={16} /> Back to {subject} roadmap</Link>
      <header className="rounded-3xl bg-ink p-6 text-white shadow-panel sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300"><BookOpen size={15} /> {subject} study topic</div>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-slate-300">Topic {topic.order || ''}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{topic.topic}</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">{topic.description || `Build your understanding of ${topic.topic} before testing your knowledge.`}</p></div><div className="flex flex-wrap gap-2"><Link to={practiceLink} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-sm font-bold text-ink transition hover:bg-teal-300"><HelpCircle size={17} /> Practice MCQs</Link><button type="button" onClick={handleDone} disabled={saving || topic.status === 'completed'} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"><CheckCircle2 size={17} /> {saving ? 'Saving...' : topic.status === 'completed' ? 'Completed' : 'Done'}</button></div></div>
      </header>
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{success}</div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8"><div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold text-ink"><BookOpen size={20} className="text-teal-700" /> Read and understand</div>{topic.reading_material ? <div className="mt-5 text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: formatReadingMaterial(topic.reading_material) }} /> : <p className="mt-5 text-sm text-slate-500">Study material is not available for this topic yet.</p>}</article>
        <aside className="space-y-6">{topic.key_concepts?.length > 0 && <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-teal-900"><Lightbulb size={17} /> Key concepts</h2><ul className="mt-4 space-y-3">{topic.key_concepts.map((concept) => <li key={concept} className="flex gap-2 text-xs leading-5 text-teal-800"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-600" />{concept}</li>)}</ul></div>}<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ready to check your recall?</p><p className="mt-2 text-sm text-slate-600">Take five generated questions focused on this topic.</p><Link to={practiceLink} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"><Sparkles size={16} /> Start practice</Link></div></aside>
      </div>
      {topic.exercises?.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8"><div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold text-ink"><ListChecks size={20} className="text-indigo-600" /> Exercises <span className="text-sm font-medium text-slate-400">({topic.exercises.length})</span></div><div className="mt-5 grid gap-4 md:grid-cols-2">{topic.exercises.map((exercise, index) => <article key={`${exercise.question}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">{index + 1}</span><div><span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">{exercise.type || 'question'}</span><p className="mt-3 text-sm font-medium leading-6 text-ink">{exercise.question}</p>{exercise.options?.length > 0 && <ul className="mt-3 space-y-2 text-xs text-slate-600">{exercise.options.map((option, optionIndex) => <li key={option} className="rounded-lg bg-white px-3 py-2"><b>{String.fromCharCode(65 + optionIndex)}.</b> {option}</li>)}</ul>}</div></div></article>)}</div></section>}
    </section>
  );
};

export default TopicStudy;