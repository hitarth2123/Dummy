import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, LoaderCircle, Sparkles, Trophy, XCircle, BookOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { llmService, studentService } from '@services/api.service';

const HISTORY_KEY = 'ai-buddy-practice-attempts';

const PracticeMCQ = () => {
  const [searchParams] = useSearchParams();
  const querySubject = searchParams.get('subject') || 'DBMS';
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [selectedSubject, setSelectedSubject] = useState(querySubject);
  const [catalog, setCatalog] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(5);
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

  useEffect(() => {
    studentService.getPracticeAttempts()
      .then((response) => {
        const serverAttempts = response.data || response;
        if (Array.isArray(serverAttempts) && serverAttempts.length) {
          setAttempts(serverAttempts.map((attempt) => ({
            topic: attempt.topic,
            subject: attempt.subject,
            score: attempt.score,
            total: attempt.total,
            marks: `${attempt.score}/${attempt.total}`,
            date: attempt.createdAt,
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    studentService.getCurriculum().then((response) => {
      const data = response.data || response;
      const semesters = data.catalog || [];
      setCatalog(semesters);
      const matchingSemester = semesters.find((semester) => (semester.specializations || []).some((specialization) => (specialization.subjects || []).some((subject) => subject.name === querySubject)));
      setSelectedSemester(matchingSemester?.number || data.semester || 5);
    }).catch(() => {});
  }, [querySubject]);

  const fallbackSubjects = [
    { name: 'DBMS', topics: ['Database Fundamentals', 'ER Modeling', 'Normalization', 'SQL', 'Transactions and ACID'] },
    { name: 'Operating Systems', topics: ['Processes and Threads', 'CPU Scheduling', 'Deadlocks', 'Memory Management'] },
    { name: 'Computer Networks', topics: ['OSI Model', 'TCP/IP', 'Routing', 'Network Security'] },
  ];
  const activeCatalog = catalog.length ? catalog : [{ number: 5, specializations: [{ name: 'Common Core', subjects: fallbackSubjects }] }];
  const activeSemester = activeCatalog.find((semester) => semester.number === Number(selectedSemester)) || activeCatalog[0];
  const subjectOptions = (activeSemester?.specializations || []).flatMap((specialization) => specialization.subjects || []).filter((subjectOption, index, all) => all.findIndex((item) => item.name === subjectOption.name) === index);
  const activeSubject = subjectOptions.find((subjectOption) => subjectOption.name === selectedSubject) || subjectOptions[0];
  const topicOptions = activeSubject?.topics || [];

  const generateWithTopic = async (topicToGenerate) => {
    setLoading(true);
    setError('');
    setQuestions([]);
    setResult(null);
    setScore(0);
    setIndex(0);
    setSelected('');
    setSubmitted(false);
    try {
      const response = await llmService.generateMcq({ topic: topicToGenerate, count: 5 });
      const data = response.data || response;
      setQuestions((data.questions || []).slice(0, 5));
      setSources(data.rag_sources || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not generate MCQs.');
    } finally {
      setLoading(false);
    }
  };

  const generate = async (event) => {
    if (event) event.preventDefault();
    if (!topic.trim()) return;
    await generateWithTopic(topic);
  };

  const submitAnswer = () => {
    const nextScore = score + (selected === question.correct_answer ? 1 : 0);
    setScore(nextScore);
    setSubmitted(true);
  };

  const nextQuestion = async () => {
    const finalQuestion = index >= questions.length - 1;
    if (finalQuestion) {
      const attempt = { topic, score, total: questions.length, marks: `${score}/${questions.length}`, date: new Date().toISOString() };
      const nextAttempts = [attempt, ...attempts].slice(0, 10);
      setAttempts(nextAttempts);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextAttempts));
      await studentService.savePracticeAttempt({
        subject: selectedSubject,
        topic,
        score,
        total: questions.length,
      }).catch(() => {});
      setResult(attempt);
      return;
    }
    setIndex((current) => current + 1);
    setSelected('');
    setSubmitted(false);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-glow">
            <BookOpen size={24} />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
              <Sparkles size={12} className="text-secondary" />
              <span className="text-primary-fixed">Practice Studio</span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              MCQ <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">Generator</span>
            </h1>
          </div>
        </div>
        <p className="relative z-10 mt-3 max-w-2xl text-sm font-medium text-on-surface-variant">
          Practice individual topics or generate questions covering an entire subject syllabus.
        </p>
      </section>

      <form onSubmit={generate} className="grid gap-4 rounded-2xl border border-surface-variant/40 bg-surface-container-low p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-outline">1. Select semester</span>
          <select value={selectedSemester} onChange={(event) => { const semester = Number(event.target.value); const firstSubject = activeCatalog.find((item) => item.number === semester)?.specializations?.[0]?.subjects?.[0]?.name || ''; setSelectedSemester(semester); setSelectedSubject(firstSubject); setTopic(''); }} className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-4 py-3 text-sm text-white outline-none focus:border-primary">
            {activeCatalog.map((semester) => <option key={semester.number} value={semester.number}>Semester {semester.number}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-outline">2. Select subject</span>
          <select value={selectedSubject} onChange={(event) => { setSelectedSubject(event.target.value); setTopic(''); }} className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-4 py-3 text-sm text-white outline-none focus:border-primary">
            {subjectOptions.map((subjectOption) => <option key={subjectOption.name} value={subjectOption.name}>{subjectOption.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-outline">3. Select topic</span>
          <select required value={topic} onChange={(event) => setTopic(event.target.value)} disabled={!topicOptions.length} className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-4 py-3 text-sm text-white outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50">
            <option value="" disabled>Choose a topic</option>
            {topicOptions.map((topicOption) => <option key={topicOption} value={topicOption}>{topicOption}</option>)}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 self-end rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-950 hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-60 shadow-md transition"
        >
          {loading && <LoaderCircle size={16} className="animate-spin" />}
          <span>4. Generate 5 Questions</span>
        </button>
      </form>

      {error && <p role="alert" className="rounded-xl bg-error-container/15 p-4 text-sm text-error">{error}</p>}

      {result && (
        <section className="rounded-2xl border border-emerald-200 bg-secondary-container/10 p-6 text-center shadow-panel">
          <Trophy className="mx-auto text-secondary" size={30} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-secondary">Practice complete</p>
          <h2 className="mt-1 text-3xl font-bold text-on-surface">{result.score} / {result.total} correct</h2>
          <p className="mt-1 text-sm text-emerald-300">Topic: {result.topic}</p>
          <button type="button" onClick={() => { setResult(null); setQuestions([]); }} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Try another set</button>
        </section>
      )}

      {question && !result && (
        <article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs text-outline">
            <span className="font-bold uppercase tracking-wider text-primary">Question {index + 1} of {questions.length}</span>
            <span>Target: {topic}</span>
          </div>

          <h2 className="text-xl font-bold text-on-surface leading-relaxed">{question.question_text || question.question}</h2>

          <div className="space-y-3">
            {(question.options || []).map((opt) => {
              const label = typeof opt === 'string' ? opt : opt.text || opt.label;
              const value = typeof opt === 'string' ? opt : opt.label || opt.text;
              const isSelected = selected === value;
              const isCorrect = question.correct_answer === value;

              let btnStyle = 'border-surface-variant/40 bg-surface-container text-on-surface hover:border-primary/50';
              if (submitted) {
                if (isCorrect) btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold';
                else if (isSelected) btnStyle = 'border-rose-500 bg-rose-500/15 text-rose-300';
              } else if (isSelected) {
                btnStyle = 'border-primary bg-primary/20 text-white font-bold ring-1 ring-primary';
              }

              return (
                <button
                  key={value}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelected(value)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm transition ${btnStyle}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-container-low text-xs font-bold text-primary">{value.slice(0, 1)}</span>
                    {label}
                  </span>
                  {submitted && isCorrect && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
                  {submitted && isSelected && !isCorrect && <XCircle size={18} className="text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-variant/30">
            {!submitted ? (
              <button
                type="button"
                disabled={!selected}
                onClick={submitAnswer}
                className="ml-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-primary-fixed disabled:opacity-40 transition shadow-md"
              >
                Submit Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={nextQuestion}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-primary-fixed transition shadow-md"
              >
                <span>{index < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </article>
      )}

      {/* History */}
      {attempts.length > 0 && (
        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel space-y-4">
          <h3 className="font-bold text-base text-on-surface">Recent Practice History</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {attempts.map((attempt, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-surface-variant/30 bg-surface-container p-3.5 text-xs">
                <div>
                  <p className="font-bold text-on-surface truncate max-w-[180px]">{attempt.topic}</p>
                  <p className="text-outline mt-0.5">{new Date(attempt.date).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 font-bold text-primary border border-primary/30">{attempt.marks}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default PracticeMCQ;
