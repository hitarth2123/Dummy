import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, HelpCircle, Lightbulb, ListChecks, LoaderCircle, Sparkles } from 'lucide-react';
import { studentService, learningPathService, llmService } from '@services/api.service';

const formatReadingMaterial = (material) => material
  .replace(/^### (.*$)/gm, '<h3 class="mt-6 mb-2 text-lg font-bold text-on-surface">$1</h3>')
  .replace(/^## (.*$)/gm, '<h2 class="mt-6 mb-3 text-xl font-bold text-on-surface">$1</h2>')
  .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-on-surface">$1</strong>')
  .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-container-high px-1.5 py-0.5 text-xs font-mono text-on-primary-container">$1</code>')
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
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    studentService.getLearningPath({ subject })
      .then((result) => {
        if (!active) return;
        const data = result.data || result;
        const foundTopic = (data.topics || []).find((item) => item.topic === topicName);
        if (foundTopic) {
          setTopic(foundTopic);
          setQuizLoading(true);
          llmService.generateMcq({ topic: topicName, subject, count: 5 })
            .then((quizResult) => {
              if (active) setQuizQuestions((quizResult.data || quizResult).questions || []);
            })
            .catch(() => {})
            .finally(() => active && setQuizLoading(false));
          const needsLesson = !foundTopic.reading_material?.trim()
            || foundTopic.reading_material.trim().length < 600
            || foundTopic.reading_material.trim().startsWith('Study ')
            || !foundTopic.simple_explanation
            || !foundTopic.study_steps?.length
            || !foundTopic.exercises?.length;
          if (needsLesson) {
            return learningPathService.generateTopic({ subject, topic: topicName })
              .then((generated) => {
                if (active) setTopic((current) => ({ ...current, ...(generated.data || generated) }));
              })
              .catch(() => {});
          }
        }
        else setError('This topic is not available in the selected learning path.');
      })
      .catch(() => { if (active) setError('Could not load this study topic.'); })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [subject, topicName]);

  const handleDone = async () => {
    if (!topic || topic.status === 'completed') return;
    if (quizScore === null || quizScore < 80) {
      setError(`Topic not completed: your MCQ checkpoint score is ${quizScore === null ? 'not submitted' : `${quizScore}%`}. You need at least 80% to continue.`);
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await studentService.completeLearningPathTopic({ subject, topic: topic.topic, quiz_score_pct: quizScore });
      setTopic((current) => ({ ...current, ...(result.data || {}) }));
      setSuccess('Topic marked as completed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this topic.');
    } finally {
      setSaving(false);
    }
  };

  const submitQuiz = () => {
    if (!quizQuestions.length || Object.keys(quizAnswers).length < quizQuestions.length) return;
    const correct = quizQuestions.reduce((total, question, index) => total + (quizAnswers[index] === question.correct_answer ? 1 : 0), 0);
    setQuizScore(Math.round((correct / quizQuestions.length) * 100));
  };

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!topic) return <section className="space-y-4"><Link to="/student/learning-path" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-on-primary-container"><ArrowLeft size={16} /> Back to learning path</Link><div role="alert" className="rounded-2xl border border-error/20 bg-error-container/15 p-6 text-sm text-error">{error || 'Topic not found.'}</div></section>;

  const practiceLink = `/student/practice-mcq?topic=${encodeURIComponent(topic.topic)}&subject=${encodeURIComponent(subject)}`;
  const concepts = topic.key_concepts?.length ? topic.key_concepts : [
    `Define ${topic.topic} and explain the problem it solves.`,
    `Identify the main components, inputs, outputs, and relationships in ${topic.topic}.`,
    `Compare the important design choices and trade-offs involved in ${topic.topic}.`,
    `Apply ${topic.topic} to a small real-world example and evaluate the result.`,
  ];
  const storedReadingMaterial = typeof topic.reading_material === 'string' ? topic.reading_material.trim() : '';
  const hasDetailedReading = storedReadingMaterial.length >= 600 && !storedReadingMaterial.startsWith('Study ');
  const readingMaterial = hasDetailedReading ? storedReadingMaterial : `## Understanding ${topic.topic}

### What this topic means
${topic.topic} is an important part of ${subject}. It describes the ideas, tools, and decisions used to solve problems in this area. Begin by defining ${topic.topic} in your own words and identifying the problem it is designed to solve.

### Concepts to understand
- Identify the main components and how they relate to one another.
- Trace the inputs, decisions, and outputs in a typical example.
- Compare common approaches and explain their trade-offs.
- Consider correctness, performance, security, and maintainability.

### How to study it
Work through one small ${topic.topic} example step by step. Change one assumption, predict what should happen, and explain why the result changes. Finish by writing a short solution or design using the topic.

### Topic takeaway
After studying this lesson, you should be able to define ${topic.topic}, explain how it works, choose when to use it, and justify your answer with a concrete example.`;
  const exercises = topic.exercises?.length ? topic.exercises : [
    { question: `Explain the main purpose of ${topic.topic} in ${subject}.` },
    { question: `Give one practical example of applying ${topic.topic}.` },
    { question: `Identify one risk and one mitigation related to ${topic.topic}.` },
  ];
    const studySteps = topic.study_steps?.length ? topic.study_steps : [
      `Define ${topic.topic} in your own words.`,
      `Trace its main components and relationships.`,
      `Work through a small example step by step.`,
      `Apply it to a new scenario and explain your reasoning.`,
    ];
    const workedExample = topic.worked_example || `Work through a small ${topic.topic} example step by step. State the assumptions, identify the relevant components, apply the method, and check whether the result makes sense.`;
    const commonMistakes = topic.common_mistakes?.length ? topic.common_mistakes : [
      `Memorizing ${topic.topic} without understanding when to apply it.`,
      'Skipping assumptions and checking neither the inputs nor the result.',
    ];
    const selfCheck = topic.self_check?.length ? topic.self_check : [
      `Can you define ${topic.topic} without notes?`,
      `Can you explain one practical use and one limitation?`,
    ];
    const simpleExplanation = topic.simple_explanation || `${topic.topic} is a focused idea in ${subject} that helps solve a particular class of problems.`;
    const whyItMatters = topic.why_it_matters || `Understanding ${topic.topic} helps you reason about real problems, choose an appropriate approach, and explain your decisions in exams and projects.`;
    const practicalHabit = topic.practical_habit || `Before using ${topic.topic}, define the problem, list your assumptions, and test your reasoning with a small example.`;
    const architectureLens = topic.architecture_lens || `Connect ${topic.topic} to the larger system: identify what depends on it, what it produces, and what can fail.`;
    const checklist = topic.completion_checklist?.length ? topic.completion_checklist : [`I can explain ${topic.topic} in simple words.`, `I can solve a basic problem involving ${topic.topic}.`, `I can describe one practical application and one limitation.`];
    const faqs = topic.faqs?.length ? topic.faqs : [{ question: `What is the main idea of ${topic.topic}?`, answer: `It is a method for understanding and solving problems related to ${topic.topic}.` }, { question: `How do I know when to use it?`, answer: 'Look at the problem requirements, assumptions, and expected output before choosing an approach.' }];
  return (
    <section id="topic-mcq-checkpoint" className="space-y-6">
      <Link to={`/student/learning-path?subject=${encodeURIComponent(subject)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-on-primary-container"><ArrowLeft size={16} /> Back to {subject} roadmap</Link>
      <header className="rounded-3xl border border-surface-variant/40 bg-surface-container-low p-6 text-on-surface shadow-panel sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary"><BookOpen size={15} /> {subject} study topic</div>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-outline">Topic {topic.order || ''}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{topic.topic}</h1><p className="mt-2 max-w-2xl text-sm text-outline">{topic.description || `Build your understanding of ${topic.topic} before testing your knowledge.`}</p></div><div className="flex flex-wrap gap-2"><Link to={practiceLink} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-secondary"><HelpCircle size={17} /> Practice MCQs</Link><button type="button" onClick={handleDone} disabled={saving || topic.status === 'completed'} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-surface-container-low/10 px-4 py-3 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-low/20 disabled:cursor-not-allowed disabled:opacity-70"><CheckCircle2 size={17} /> {saving ? 'Saving...' : topic.status === 'completed' ? 'Completed' : 'Done'}</button></div></div>
      </header>
      {success && <div className="rounded-xl border border-emerald-200 bg-secondary-container/10 p-4 text-sm font-medium text-emerald-300">{success}</div>}
      {error && <div role="alert" className="rounded-xl border border-error/20 bg-error-container/15 p-4 text-sm font-medium text-error">{error}</div>}
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-primary/30 bg-primary-container/10 p-6 shadow-panel"><p className="text-xs font-bold uppercase tracking-wider text-primary">This topic in simple words</p><p className="mt-3 text-sm leading-7 text-on-surface">{simpleExplanation}</p></article>
        <article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel"><p className="text-xs font-bold uppercase tracking-wider text-outline">Why this lesson matters</p><p className="mt-3 text-sm leading-7 text-on-surface-variant">{whyItMatters}</p></article>
        <article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel"><p className="text-xs font-bold uppercase tracking-wider text-outline">One practical habit</p><p className="mt-3 text-sm leading-7 text-on-surface-variant">{practicalHabit}</p></article>
        <article className="rounded-2xl border border-secondary/30 bg-secondary-container/10 p-6 shadow-panel"><p className="text-xs font-bold uppercase tracking-wider text-secondary">Architecture and application lens</p><p className="mt-3 text-sm leading-7 text-on-surface-variant">{architectureLens}</p></article>
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel sm:p-8"><div className="flex items-center gap-2 border-b border-surface-variant/20 pb-4 text-lg font-bold text-on-surface"><BookOpen size={20} className="text-primary" /> Understand the concepts</div><div className="mt-5 text-sm leading-7 text-on-surface" dangerouslySetInnerHTML={{ __html: formatReadingMaterial(readingMaterial) }} /></article>
        <aside className="space-y-6"><div className="rounded-2xl border border-primary/30 bg-primary-container/15 p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-on-primary-container"><Lightbulb size={17} /> Key concepts</h2><ul className="mt-4 space-y-3">{concepts.map((concept, index) => <li key={`${concept}-${index}`} className="flex gap-2 text-xs leading-5 text-on-primary-container"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary" />{concept}</li>)}</ul></div><div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel"><p className="text-xs font-semibold uppercase tracking-wider text-outline">Ready to check your recall?</p><p className="mt-2 text-sm text-on-surface-variant">Take five generated questions focused on this topic.</p><Link to={practiceLink} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white hover:bg-inverse-primary"><Sparkles size={16} /> Start practice</Link></div></aside>
      </div>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel sm:p-8"><h2 className="text-lg font-bold text-on-surface">How to understand {topic.topic}</h2><ol className="mt-5 space-y-3">{studySteps.map((step, index) => <li key={`${step}-${index}`} className="flex gap-3 text-sm leading-6 text-on-surface-variant"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-container/20 text-xs font-bold text-primary">{index + 1}</span><span>{step}</span></li>)}</ol></article>
        <article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel sm:p-8"><h2 className="text-lg font-bold text-on-surface">Worked example</h2><div className="mt-4 whitespace-pre-line text-sm leading-7 text-on-surface-variant">{workedExample}</div></article>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-amber-200/20 bg-amber-500/5 p-6 shadow-panel sm:p-8"><h2 className="text-lg font-bold text-on-surface">Common mistakes</h2><ul className="mt-4 space-y-3">{commonMistakes.map((mistake, index) => <li key={`${mistake}-${index}`} className="flex gap-3 text-sm leading-6 text-on-surface-variant"><span className="font-bold text-amber-400">!</span><span>{mistake}</span></li>)}</ul></article>
        <article className="rounded-2xl border border-primary/30 bg-primary-container/10 p-6 shadow-panel sm:p-8"><h2 className="text-lg font-bold text-on-surface">Self-check</h2><ul className="mt-4 space-y-3">{selfCheck.map((question, index) => <li key={`${question}-${index}`} className="flex gap-3 text-sm leading-6 text-on-surface-variant"><span className="font-bold text-primary">{index + 1}.</span><span>{question}</span></li>)}</ul></article>
      </section>
      <section className="rounded-2xl border border-primary/30 bg-primary-container/10 p-6 shadow-panel sm:p-8"><div className="flex items-center justify-between gap-3 border-b border-surface-variant/20 pb-4"><div className="flex items-center gap-2 text-lg font-bold text-on-surface"><ListChecks size={20} className="text-primary" /> Topic MCQ checkpoint</div>{quizScore !== null && <span className={quizScore >= 80 ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'}>{quizScore}%</span>}</div><p className="mt-3 text-sm text-on-surface-variant">Answer every question. You need at least 80% to mark this topic as done.</p>{quizLoading ? <div className="mt-5 flex items-center gap-2 text-sm text-outline"><LoaderCircle size={16} className="animate-spin" /> Generating checkpoint...</div> : <div className="mt-5 space-y-5">{quizQuestions.map((question, index) => <article key={`${question.question_text}-${index}`} className="rounded-xl border border-surface-variant/40 bg-surface-container p-5"><p className="text-sm font-semibold text-on-surface">Q{index + 1}. {question.question_text || question.question}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{(question.options || []).map((option) => <button key={option.label} type="button" onClick={() => setQuizAnswers((previous) => ({ ...previous, [index]: option.label }))} className={`rounded-lg border px-3 py-2 text-left text-xs transition ${quizAnswers[index] === option.label ? 'border-primary bg-primary/20 text-white' : 'border-surface-variant/40 bg-surface-container-low text-on-surface-variant hover:border-primary/50'}`}>{option.label}. {option.text}</button>)}</div></article>)}<button type="button" disabled={!quizQuestions.length || Object.keys(quizAnswers).length < quizQuestions.length} onClick={submitQuiz} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">Submit checkpoint</button>{quizScore !== null && quizScore < 80 && <p className="text-sm font-medium text-rose-400">You need 80% or more. Review the lesson and try again.</p>}{quizScore !== null && quizScore >= 80 && <p className="text-sm font-medium text-emerald-400">Checkpoint passed. You can now mark this topic as done.</p>}</div>}</section>
      <section className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel sm:p-8"><div className="flex items-center gap-2 border-b border-surface-variant/20 pb-4 text-lg font-bold text-on-surface"><ListChecks size={20} className="text-primary" /> Practice sprint <span className="text-sm font-medium text-outline">({exercises.length})</span></div><p className="mt-3 text-sm text-on-surface-variant">Attempt these exercises before opening practice MCQs. Write down your reasoning, not just the final answer.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{exercises.map((exercise, index) => { const exerciseText = typeof exercise === 'string' ? exercise : exercise.question || exercise.prompt || 'Practice this topic with a worked example.'; return <article key={`${exerciseText}-${index}`} className="rounded-xl border border-surface-variant/40 bg-surface-container p-5"><div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-container/20 text-xs font-bold text-primary">{index + 1}</span><div><span className="rounded-full bg-primary-container/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{exercise.type || 'question'}</span><p className="mt-3 text-sm font-medium leading-6 text-on-surface">{exerciseText}</p></div></div></article>; })}</div></section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-primary/30 bg-primary-container/10 p-6 shadow-panel sm:p-8"><h2 className="text-lg font-bold text-on-surface">Lesson completion checklist</h2><ul className="mt-4 space-y-3">{checklist.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-on-surface-variant"><CheckCircle2 size={16} className="mt-1 shrink-0 text-primary" />{item}</li>)}</ul></article>
        <article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel sm:p-8"><h2 className="text-lg font-bold text-on-surface">Frequently asked questions</h2><div className="mt-4 space-y-4">{faqs.map((faq, index) => <div key={`${faq.question}-${index}`}><h3 className="text-sm font-semibold text-on-surface">{faq.question}</h3><p className="mt-1 text-sm leading-6 text-on-surface-variant">{faq.answer}</p></div>)}</div></article>
      </section>
    </section>
  );
};

export default TopicStudy;