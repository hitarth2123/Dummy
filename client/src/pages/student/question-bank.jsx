import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  HelpCircle,
  LoaderCircle,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { studentService } from '@services/api.service';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (subjectFilter) params.subject = subjectFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
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
  }, [page, subjectFilter, difficultyFilter, bookmarkedOnly]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">PYQ Repository</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Question Bank</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse verified exam questions, bookmark key problems, and launch practice sets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/student/mock-test"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 shadow-sm"
          >
            <Play size={16} />
            <span>Generate Mock Test</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 sm:flex-wrap">
        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or topics..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600 focus:bg-white"
          />
        </div>

        {/* Subject Select */}
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600"
        >
          <option value="">All Subjects</option>
          <option value="DBMS">Database Management (DBMS)</option>
          <option value="Data Structures">Data Structures & Algorithms</option>
          <option value="Operating Systems">Operating Systems</option>
          <option value="Computer Networks">Computer Networks</option>
          <option value="Software Engineering">Software Engineering</option>
        </select>

        {/* Difficulty Select */}
        <select
          value={difficultyFilter}
          onChange={(e) => {
            setDifficultyFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-teal-600"
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
              ? 'border-amber-500 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bookmark size={16} className={bookmarkedOnly ? 'fill-amber-500 text-amber-500' : ''} />
          <span>{bookmarkedOnly ? 'Bookmarked Only' : 'All Questions'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-teal-700" />
        </div>
      )}

      {/* Questions Grid */}
      {!loading && filteredQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
            <span>Showing {filteredQuestions.length} questions</span>
            <span>Page {pagination.page} of {pagination.pages}</span>
          </div>

          <div className="grid gap-4">
            {filteredQuestions.map((q, idx) => (
              <article
                key={q._id || idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                      {q.subject}
                    </span>
                    {q.topic && (
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {q.topic}
                      </span>
                    )}
                    {q.year && (
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        Exam Year: {q.year}
                      </span>
                    )}
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                        q.difficulty === 'easy'
                          ? 'bg-emerald-50 text-emerald-700'
                          : q.difficulty === 'hard'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
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
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    }`}
                  >
                    <Bookmark size={18} className={q.is_bookmarked ? 'fill-amber-600' : ''} />
                  </button>
                </div>

                <h3 className="mt-4 text-base font-semibold text-ink leading-relaxed">
                  {q.question_text}
                </h3>

                {/* Options Preview */}
                {q.options && q.options.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className="rounded-xl border border-slate-150 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700"
                      >
                        <b className="font-semibold text-slate-900">{opt.label}.</b> {opt.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">ID: {q._id}</span>
                  <Link
                    to={`/student/practice-mcq?topic=${encodeURIComponent(q.topic || q.subject)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
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
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span className="text-sm font-medium text-slate-600">
                Page {page} of {pagination.pages}
              </span>

              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredQuestions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          <ClipboardList className="mx-auto mb-3 text-teal-700" size={32} />
          <h3 className="text-lg font-semibold text-ink">No questions found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {bookmarkedOnly
              ? 'You have not bookmarked any questions yet.'
              : 'Try clearing your search query or filters to view available questions.'}
          </p>
        </div>
      )}
    </div>
  );
}
