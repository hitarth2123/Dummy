import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  HelpCircle,
  LoaderCircle,
  MessageSquare,
  Play,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { studentService } from '@services/api.service';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    studentService
      .getDashboard()
      .then((res) => setData(res.data || res))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  const { user, agenda = [], exams = [] } = data || {};
  const enrolledCount = user?.enrolled_subjects?.length || 0;
  const weakCount = user?.weak_topics?.length || 0;
  const nextExam = exams[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-slate-900 to-teal-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 border border-teal-500/30">
            <Sparkles size={14} />
            <span>Student Dashboard</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base">
            {user?.department || 'Computer Science'} · Semester {user?.semester || 5}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/student/mock-test"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 shadow-lg shadow-teal-900/40"
            >
              <Play size={16} />
              <span>Generate Mock Test</span>
            </Link>
            <Link
              to="/student/question-bank"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 border border-white/15"
            >
              <ClipboardList size={16} />
              <span>Browse Question Bank</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enrolled Subjects</p>
              <p className="text-2xl font-bold text-ink">{enrolledCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weak Topics</p>
              <p className="text-2xl font-bold text-ink">{weakCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agenda Topics</p>
              <p className="text-2xl font-bold text-ink">{agenda.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Exam</p>
              <p className="text-sm font-bold text-ink truncate">
                {nextExam ? nextExam.subject : 'None scheduled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tools */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-ink">Learning Tools</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Instant Access</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Mock Test */}
          <Link
            to="/student/mock-test"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <FileText size={22} />
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Timed Test Studio
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-teal-700 transition">
                Mock Test Generator
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Generate a timed 30–50 question mock test derived from your course syllabus.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-teal-700">
              <span>Start Mock Test</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Question Bank */}
          <Link
            to="/student/question-bank"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
                  <ClipboardList size={22} />
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  PYQ Archives
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-teal-700 transition">
                Question Bank
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Browse previous year questions by subject, topic, difficulty, and bookmarks.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-teal-700">
              <span>Browse Questions</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Learning Path */}
          <Link
            to="/student/learning-path"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <BookOpen size={22} />
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Personal Study Plan
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-teal-700 transition">
                Learning Path
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Adaptive study roadmap ordering your weakest areas first with guided topics.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-teal-700">
              <span>View Learning Path</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Practice MCQ */}
          <Link
            to="/student/practice-mcq"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md">
                  <HelpCircle size={22} />
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  RAG Generated
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-teal-700 transition">
                Practice MCQs
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Instant topic-wise practice sets with answers and textbook citations.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-teal-700">
              <span>Practice Set</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* AI Tutor */}
          <Link
            to="/student/ai-tutor"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
                  <MessageSquare size={22} />
                </div>
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  24/7 AI Assistant
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-teal-700 transition">
                AI Tutor Chat
              </h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Ask questions and clarify course concepts with cited answers from your curriculum.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-teal-700">
              <span>Ask AI Tutor</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Main Grid: Agenda & Upcoming Exams */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Active Study Agenda */}
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Active Study Agenda</h2>
              <p className="text-xs text-slate-500">Topics assigned based on your current weak areas</p>
            </div>
            <Link to="/student/learning-path" className="text-xs font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {agenda.map((item, idx) => (
              <div
                key={item.topic || idx}
                className="flex items-center justify-between rounded-xl border border-slate-150 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 font-bold text-xs text-teal-800">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm text-ink">{item.topic}</h3>
                    <p className="text-xs text-slate-500">{item.subject || 'Coursework'}</p>
                  </div>
                </div>
                <Link
                  to={`/student/practice-mcq?topic=${encodeURIComponent(item.topic)}`}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 border border-teal-200 hover:bg-teal-50"
                >
                  Practice
                </Link>
              </div>
            ))}

            {agenda.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                <CheckCircle2 className="mx-auto mb-2 text-teal-600" size={24} />
                <p className="text-sm">No weak topics pending! Take a mock test to refresh your plan.</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Exam Timetable */}
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Upcoming Exam Schedule</h2>
              <p className="text-xs text-slate-500">Department timetable for this semester</p>
            </div>
          </div>

          <div className="space-y-3">
            {exams.map((exam, idx) => (
              <div
                key={exam._id || idx}
                className="flex items-center justify-between rounded-xl border border-slate-150 bg-slate-50 p-4"
              >
                <div>
                  <h3 className="font-semibold text-sm text-ink">{exam.subject}</h3>
                  <p className="text-xs text-slate-500">
                    {exam.exam_type || 'Internal'} · Venue: {exam.venue || 'Main Hall'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-teal-800">
                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'TBD'}
                  </p>
                  <p className="text-xs text-slate-400">{exam.time_slot || '09:00 AM'}</p>
                </div>
              </div>
            ))}

            {exams.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                <Calendar className="mx-auto mb-2 text-slate-400" size={24} />
                <p className="text-sm">No upcoming exams published yet for your department.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
