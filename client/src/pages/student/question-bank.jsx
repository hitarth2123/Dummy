import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Filter,
  HelpCircle,
  LoaderCircle,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { studentService, llmService } from '@services/api.service';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [setNameFilter, setSetNameFilter] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Available question sets
  const [availableSets, setAvailableSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [mockSet, setMockSet] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(5);
  const [generationTopic, setGenerationTopic] = useState('');
  const [generatingSets, setGeneratingSets] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');

  useEffect(() => {
    studentService.getCurriculum().then((response) => {
      const data = response.data || response;
      setCatalog(data.catalog || []);
      setSelectedSemester(data.semester || data.catalog?.[0]?.number || 5);
    }).catch(() => {});
  }, []);

  const fallbackSubjects = [
    { name: 'DBMS', topics: ['Database Fundamentals', 'ER Modeling', 'Normalization', 'SQL', 'Transactions and ACID'] },
    { name: 'Operating Systems', topics: ['Processes and Threads', 'CPU Scheduling', 'Deadlocks', 'Memory Management'] },
    { name: 'Computer Networks', topics: ['OSI Model', 'TCP/IP', 'Routing', 'Network Security'] },
  ];
  const activeCatalog = catalog.length ? catalog : [{ number: 5, specializations: [{ name: 'Common Core', subjects: fallbackSubjects }] }];
  const activeSemester = activeCatalog.find((semester) => semester.number === Number(selectedSemester)) || activeCatalog[0];
  const generationSubjects = (activeSemester?.specializations || []).flatMap((specialization) => specialization.subjects || []).filter((subject, index, all) => all.findIndex((item) => item.name === subject.name) === index);
  const generationSubject = generationSubjects.find((subject) => subject.name === subjectFilter) || generationSubjects[0];

  const generateSets = async () => {
    if (!generationSubject?.name || !generationTopic) return;
    setGeneratingSets(true);
    setGenerationMessage('');
    try {
      const response = await llmService.generateQuestionSets({ subject: generationSubject.name, topic: generationTopic, count: 5, set_count: 3 });
      const generated = response.data || response;
      setGenerationMessage(`Generated ${generated.length || 3} sets for ${generationSubject.name} · ${generationTopic}.`);
      setSubjectFilter(generationSubject.name);
      setSetNameFilter(generated[0]?.set_name || '');
      setPage(1);
    } catch (requestError) {
      setGenerationMessage(requestError.response?.data?.message || 'Could not generate question sets.');
    } finally {
      setGeneratingSets(false);
    }
  };

  // Fetch available sets when subject changes
  useEffect(() => {
    setSetsLoading(true);
    studentService
      .getQuestionSets({ subject: subjectFilter || undefined })
      .then((res) => {
        const sets = Array.isArray(res) ? res : (res?.data || []);
        setAvailableSets(sets);
      })
      .catch(() => setAvailableSets([]))
      .finally(() => setSetsLoading(false));
  }, [subjectFilter]);

  const fetchQuestions = useCallback(async () => {
    if (!setNameFilter) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (subjectFilter) params.subject = subjectFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (setNameFilter) params.set_name = setNameFilter;
      if (bookmarkedOnly) params.bookmarked = 'true';

      const res = await studentService.getQuestionBank(params);
      const data = res.data || res;
      setQuestions(data.questions || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load question bank.');
    } finally {
      setLoading(false);
    }
  }, [page, subjectFilter, difficultyFilter, setNameFilter, bookmarkedOnly]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleToggleBookmark = async (id) => {
    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) => (q._id === id ? { ...q, is_bookmarked: !q.is_bookmarked } : q))
    );
    try {
      await studentService.toggleBookmark(id);
    } catch (err) {
      // Revert if request fails
      setQuestions((prev) =>
        prev.map((q) => (q._id === id ? { ...q, is_bookmarked: !q.is_bookmarked } : q))
      );
    }
  };

  // Filter client-side search query on question_text or topic
  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.question_text?.toLowerCase().includes(query) ||
      q.topic?.toLowerCase().includes(query) ||
      q.subject?.toLowerCase().includes(query)
    );
  });

  const setsByYear = availableSets.reduce((groups, set) => {
    const year = set.year || 'Other papers';
    if (!groups[year]) groups[year] = [];
    groups[year].push(set);
    return groups;
  }, {});
  const paperYears = Object.keys(setsByYear).sort((firstYear, secondYear) => {
    if (firstYear === 'Other papers') return 1;
    if (secondYear === 'Other papers') return -1;
    return Number(secondYear) - Number(firstYear);
  });
  const showingPaperQuestions = Boolean(setNameFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
              <Sparkles size={12} className="text-secondary" />
              <span className="text-primary-fixed">PYQ Repository</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Question <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">Bank</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-on-surface-variant">
              Browse verified exam questions, bookmark key problems, and launch practice sets.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/student/mock-test"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-primary-fixed hover:shadow-glow shadow-md"
            >
              <Play size={16} fill="currentColor" />
              <span>Generate Mock Test</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-surface-container-low p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">AI set generator</p><h2 className="mt-1 text-xl font-bold text-on-surface">Create three practice sets</h2><p className="mt-1 text-sm text-on-surface-variant">Choose a semester, subject, and topic. Each generated set is saved in the question bank.</p></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">1. Semester</span><select value={selectedSemester} onChange={(event) => { const semester = Number(event.target.value); const first = activeCatalog.find((item) => item.number === semester)?.specializations?.[0]?.subjects?.[0]?.name || ''; setSelectedSemester(semester); setSubjectFilter(first); setGenerationTopic(''); }} className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary">{activeCatalog.map((semester) => <option key={semester.number} value={semester.number}>Semester {semester.number}</option>)}</select></label>
          <label><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">2. Subject</span><select value={generationSubject?.name || ''} onChange={(event) => { setSubjectFilter(event.target.value); setGenerationTopic(''); }} className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary">{generationSubjects.map((subject) => <option key={subject.name} value={subject.name}>{subject.name}</option>)}</select></label>
          <label><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-outline">3. Topic</span><select value={generationTopic} onChange={(event) => setGenerationTopic(event.target.value)} disabled={!generationSubject?.topics?.length} className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"><option value="">Choose a topic</option>{(generationSubject?.topics || []).map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select></label>
          <button type="button" onClick={generateSets} disabled={generatingSets || !generationTopic} className="self-end inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-50">{generatingSets && <LoaderCircle size={16} className="animate-spin" />}<span>{generatingSets ? 'Generating 3 sets...' : '4. Generate 3 sets'}</span></button>
        </div>
        {generationMessage && <p role="status" className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-on-surface">{generationMessage}</p>}
      </section>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-4 shadow-panel space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 sm:flex-wrap">
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-3 text-outline" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or topics..."
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container/50 pl-10 pr-4 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:bg-surface-container-low"
          />
        </div>

        {/* Subject Select */}
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setSetNameFilter(''); // reset set filter when subject changes
            setPage(1);
          }}
          className="rounded-xl border border-surface-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary"
        >
          <option value="">All Subjects</option>
          <option value="DBMS">Database Management (DBMS)</option>
          <option value="Data Structures">Data Structures & Algorithms</option>
          <option value="Operating Systems">Operating Systems</option>
          <option value="Computer Networks">Computer Networks</option>
          <option value="Software Engineering">Software Engineering</option>
        </select>

        {/* Set Filter */}
        <select
          value={setNameFilter}
          onChange={(e) => {
            setSetNameFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-surface-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary"
        >
          <option value="">All Exam Sets</option>
          {availableSets.map((s) => (
            <option key={s.set_name} value={s.set_name}>
              {s.set_name} ({s.question_count} Qs)
            </option>
          ))}
        </select>

        {/* Difficulty Select */}
        <select
          value={difficultyFilter}
          onChange={(e) => {
            setDifficultyFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-surface-variant/40 bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* Bookmarked Only Switch */}
        <button
          type="button"
          onClick={() => {
            setBookmarkedOnly(!bookmarkedOnly);
            setPage(1);
          }}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
            bookmarkedOnly
              ? 'border-amber-500 bg-secondary-container/15 text-amber-300'
              : 'border-surface-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <Bookmark size={16} className={bookmarkedOnly ? 'fill-amber-500 text-amber-500' : ''} />
          <span>{bookmarkedOnly ? 'Bookmarked Only' : 'All Questions'}</span>
        </button>
      </div>

      {/* Visible year-wise question papers */}
      <section className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Previous year papers</p>
            <h2 className="mt-1 text-xl font-bold text-on-surface">Question papers by year</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Choose a subject paper set to view every question from that exam.</p>
          </div>
          {setsLoading && <LoaderCircle className="h-5 w-5 animate-spin text-primary" />}
        </div>

        {!setsLoading && paperYears.length > 0 && (
          <div className="mt-5 space-y-5">
            {paperYears.map((year) => (
              <div key={year}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-on-surface">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-container/15 text-primary">{year === 'Other papers' ? '?' : String(year).slice(-2)}</span>
                  {year}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {setsByYear[year].map((set) => (
                    <Link
                      key={`${year}-${set.set_name}`}
                      to={`/student/question-bank/paper?subject=${encodeURIComponent(set.subject || subjectFilter || 'DBMS')}&set=${encodeURIComponent(set.set_name)}`}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                        setNameFilter === set.set_name
                          ? 'border-primary bg-primary-container/15 ring-1 ring-primary-500'
                          : 'border-surface-variant/40 bg-surface-container hover:border-teal-300 hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <FileText size={18} className="shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-on-surface">{set.set_name}</span>
                          <span className="mt-0.5 block text-xs text-on-surface-variant">{set.subject || subjectFilter || 'All subjects'}</span>
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-surface-container-low px-2 py-1 text-[11px] font-bold text-on-primary-container shadow-md">{set.question_count} Qs</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!setsLoading && paperYears.length === 0 && (
          <p className="mt-5 rounded-xl border border-dashed border-surface-variant/50 p-6 text-center text-sm text-on-surface-variant">No question paper sets are available for this subject yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-primary/10 p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Assessment studio</p>
            <h2 className="mt-1 text-xl font-bold text-on-surface">Generate a mock test from a paper set</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Select a previous-year set to carry its subject and paper context into the mock-test generator.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[340px] sm:flex-row">
            <select value={mockSet} onChange={(event) => setMockSet(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-indigo-200 bg-surface-container-low px-3.5 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-indigo-500">
              <option value="">Select a paper set</option>
              {availableSets.map((set) => <option key={set.set_name} value={set.set_name}>{set.set_name} ({set.question_count} Qs)</option>)}
            </select>
            <Link to={mockSet ? `/student/mock-test?subject=${encodeURIComponent(availableSets.find((set) => set.set_name === mockSet)?.subject || subjectFilter || 'DBMS')}&set=${encodeURIComponent(mockSet)}` : '#'} onClick={(event) => { if (!mockSet) event.preventDefault(); }} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${mockSet ? 'bg-indigo-700 hover:bg-indigo-800' : 'cursor-not-allowed bg-indigo-300'}`}>
              <Play size={16} /> Generate mock test
            </Link>
          </div>
        </div>
      </section>

      {/* Active Set Info */}
      {setNameFilter && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-primary/10 px-4 py-3">
          <FileText size={18} className="text-primary" />
          <div>
            <p className="text-sm font-semibold text-indigo-300">Viewing: {setNameFilter}</p>
            <p className="text-xs text-primary">
              {availableSets.find((s) => s.set_name === setNameFilter)?.question_count || '?'} questions in this set
              {subjectFilter && ` · ${subjectFilter}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSetNameFilter('')}
            className="ml-auto text-xs font-semibold text-primary hover:text-indigo-300 transition"
          >
            Clear set filter
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-error-container/15 p-4 text-sm text-error border border-error/20">
          {error}
        </div>
      )}

      {/* Question results are shown only on a selected paper page. */}
      {showingPaperQuestions && loading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Questions Grid */}
      {showingPaperQuestions && !loading && filteredQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1">
            <span>Showing {filteredQuestions.length} questions</span>
            <span>Page {pagination.page} of {pagination.pages}</span>
          </div>

          <div className="grid gap-4">
            {filteredQuestions.map((q, idx) => (
              <article
                key={q._id || idx}
                className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel transition hover:border-surface-variant/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary-container/15 px-2.5 py-1 text-xs font-semibold text-on-primary-container">
                      {q.subject}
                    </span>
                    {q.topic && (
                      <span className="rounded-md bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                        {q.topic}
                      </span>
                    )}
                    {q.set_name && (
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-indigo-100">
                        {q.set_name}
                      </span>
                    )}
                    {q.year && (
                      <span className="rounded-md bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                        Exam Year: {q.year}
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                        q.difficulty === 'easy'
                          ? 'bg-secondary-container/10 text-secondary'
                          : q.difficulty === 'hard'
                          ? 'bg-error-container/15 text-error'
                          : 'bg-secondary-container/15 text-secondary'
                      }`}
                    >
                      {q.difficulty || 'medium'}
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(q._id)}
                    aria-label="Toggle Bookmark"
                    className={`rounded-xl p-2 transition ${
                      q.is_bookmarked
                        ? 'bg-secondary-container/20 text-secondary hover:bg-amber-200'
                        : 'bg-surface-container-high text-outline hover:bg-surface-variant hover:text-on-surface-variant'
                    }`}
                  >
                    <Bookmark size={18} className={q.is_bookmarked ? 'fill-amber-600' : ''} />
                  </button>
                </div>

                <h3 className="mt-4 text-base font-semibold text-on-surface leading-relaxed">
                  {q.question_text}
                </h3>

                {/* Options Preview */}
                {q.options && q.options.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className="rounded-xl border border-surface-variant/30 bg-surface-container px-3.5 py-2.5 text-xs text-on-surface"
                      >
                        <b className="font-semibold text-on-surface">{opt.label}.</b> {opt.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-surface-variant/20 pt-4">
                  <span className="text-xs text-outline">ID: {q._id}</span>
                  <Link
                    to={`/student/practice-mcq?topic=${encodeURIComponent(q.topic || q.subject)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <HelpCircle size={14} />
                    <span>Practice this topic</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-variant/40 pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-surface-variant/40 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span className="text-sm font-medium text-on-surface-variant">
                Page {page} of {pagination.pages}
              </span>

              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-surface-variant/40 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {showingPaperQuestions && !loading && filteredQuestions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-variant/50 bg-surface-container-low p-12 text-center text-on-surface-variant">
          <ClipboardList className="mx-auto mb-3 text-primary" size={32} />
          <h3 className="text-lg font-semibold text-on-surface">No questions found</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {bookmarkedOnly
              ? 'You have not bookmarked any questions yet.'
              : 'Try clearing your search query or filters to view available questions.'}
          </p>
        </div>
      )}

      <Link to="/student/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-surface-variant/40 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface shadow-md hover:bg-surface-container">
        <ChevronLeft size={16} /> Back to dashboard
      </Link>
    </div>
  );
}
