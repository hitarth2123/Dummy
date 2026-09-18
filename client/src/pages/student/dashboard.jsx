import React, { useEffect, useMemo, useState } from 'react';
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
  Layers3,
} from 'lucide-react';
import { studentService } from '@services/api.service';
import FloatingAICore from '@components/three/FloatingAICore';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [curriculumData, setCurriculumData] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(5);
  const [selectedSpecialization, setSelectedSpecialization] = useState('Common Core');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    const load = () => studentService
      .getDashboard()
      .then((res) => setData(res.data || res))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard.'))
      .finally(() => setLoading(false));
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    studentService.getCurriculum()
      .then((res) => {
        const curriculum = res.data || res;
        setCurriculumData(curriculum);
        setSelectedSemester(curriculum.semester || 5);
        setSelectedSpecialization(curriculum.specialization || 'Common Core');
      })
      .catch(() => setCurriculumData(null));
  }, []);

  const activeSemester = curriculumData?.catalog?.find((semester) => semester.number === Number(selectedSemester));
  const specializationOptions = activeSemester?.specializations || [];
  const activeSpecialization = specializationOptions.find(({ name }) => name === selectedSpecialization)
    || specializationOptions[0];
  const activeSubjects = activeSpecialization?.subjects || [];
  const activeSubject = activeSubjects.find(({ name }) => name === selectedSubject) || activeSubjects[0];

  const curriculumLabel = useMemo(() => [
    curriculumData?.course || 'B.Tech',
    `Semester ${selectedSemester}`,
    activeSpecialization?.name,
  ].filter(Boolean).join(' · '), [activeSpecialization?.name, curriculumData?.course, selectedSemester]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
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
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Text content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 shadow-sm">
              <Sparkles size={14} className="text-secondary" />
              <span className="text-primary-fixed">Student Dashboard</span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">{user?.name || 'Student'}</span> 👋
            </h1>
            <p className="mt-2 text-on-surface-variant font-medium text-sm sm:text-base">
              {user?.department || 'Computer Science'} · Semester {user?.semester || 5}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/student/mock-test"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-primary-fixed hover:shadow-glow shadow-md"
              >
                <Play size={16} fill="currentColor" />
                <span>Generate Mock Test</span>
              </Link>
              <Link
                to="/student/question-bank"
                className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-bright border border-surface-variant/50"
              >
                <ClipboardList size={16} className="text-secondary" />
                <span>Browse Question Bank</span>
              </Link>
            </div>
          </div>

          {/* 3D Floating AI Core */}
          <div className="hidden lg:block shrink-0" style={{ marginRight: '-1rem', marginTop: '-1rem', marginBottom: '-1rem' }}>
            <FloatingAICore />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your academic path</p>
            <h2 className="mt-1 text-2xl font-bold text-on-surface">{curriculumLabel}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Choose a semester and specialization to explore its subjects and topics.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Semester
              <select
                value={selectedSemester}
                onChange={(event) => {
                  const nextSemester = Number(event.target.value);
                  const next = curriculumData?.catalog?.find((semester) => semester.number === nextSemester);
                  setSelectedSemester(nextSemester);
                  setSelectedSpecialization(next?.specializations?.[0]?.name || 'Common Core');
                  setSelectedSubject('');
                }}
                className="mt-1 block min-w-44 rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-on-surface outline-none focus:border-primary"
              >
                {(curriculumData?.catalog || []).map((semester) => <option key={semester.number} value={semester.number}>Semester {semester.number}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Specialization
              <select
                value={activeSpecialization?.name || selectedSpecialization}
                onChange={(event) => { setSelectedSpecialization(event.target.value); setSelectedSubject(''); }}
                className="mt-1 block min-w-52 rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-on-surface outline-none focus:border-primary"
              >
                {specializationOptions.map((specialization) => <option key={specialization.name} value={specialization.name}>{specialization.name}</option>)}
              </select>
            </label>
          </div>
        </div>

        {activeSubjects.length > 0 && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {activeSubjects.map((subject) => <button
            key={subject.name}
            type="button"
            onClick={() => setSelectedSubject(subject.name)}
            className={`rounded-2xl border p-4 text-left transition ${activeSubject?.name === subject.name ? 'border-primary bg-primary-container/15 shadow-md' : 'border-surface-variant/40 bg-surface-container hover:border-teal-300 hover:bg-surface-container-low'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-container-low text-primary shadow-md"><Layers3 size={17} /></span>
              <span className="text-xs font-semibold text-outline">{subject.topics.length} topics</span>
            </div>
            <h3 className="mt-4 font-semibold leading-5 text-on-surface">{subject.name}</h3>
          </button>)}
        </div>}

        {activeSubject && <div className="mt-5 rounded-2xl border border-primary/20 bg-primary-container/15/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-teal-300">{activeSubject.name} topics</h3>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">{activeSpecialization?.name}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{activeSubject.topics.map((topic) => <span key={topic} className="rounded-full border border-primary/30 bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-primary-container">{topic}</span>)}</div>
        </div>}
      </section>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-container/15 text-primary">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Enrolled Subjects</p>
              <p className="text-2xl font-bold text-on-surface">{enrolledCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary-container/15 text-secondary">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Weak Topics</p>
              <p className="text-2xl font-bold text-on-surface">{weakCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Agenda Topics</p>
              <p className="text-2xl font-bold text-on-surface">{agenda.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-error-container/15 text-error">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Next Exam</p>
              <p className="text-sm font-bold text-on-surface truncate">
                {nextExam ? nextExam.subject : 'None scheduled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tools */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Learning Tools</h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-outline">Instant Access</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Mock Test */}
          <Link
            to="/student/mock-test"
            className="group relative flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                  <FileText size={22} />
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Timed Test Studio
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-on-surface group-hover:text-primary transition">
                Mock Test Generator
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                Generate a timed 30–50 question mock test derived from your course syllabus.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-primary">
              <span>Start Mock Test</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Question Bank */}
          <Link
            to="/student/question-bank"
            className="group relative flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md">
                  <ClipboardList size={22} />
                </div>
                <span className="rounded-full bg-primary-container/15 px-3 py-1 text-xs font-semibold text-primary">
                  PYQ Archives
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-on-surface group-hover:text-primary transition">
                Question Bank
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                Browse previous year questions by subject, topic, difficulty, and bookmarks.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-primary">
              <span>Browse Questions</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Learning Path */}
          <Link
            to="/student/learning-path"
            className="group relative flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-secondary-container to-secondary text-white shadow-md">
                  <BookOpen size={22} />
                </div>
                <span className="rounded-full bg-secondary-container/15 px-3 py-1 text-xs font-semibold text-secondary">
                  Personal Study Plan
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-on-surface group-hover:text-primary transition">
                Learning Path
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                Adaptive study roadmap ordering your weakest areas first with guided topics.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-primary">
              <span>View Learning Path</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Practice MCQ */}
          <Link
            to="/student/practice-mcq"
            className="group relative flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-inverse-primary to-secondary text-white shadow-md">
                  <HelpCircle size={22} />
                </div>
                <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-secondary">
                  RAG Generated
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-on-surface group-hover:text-primary transition">
                Practice MCQs
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                Instant topic-wise practice sets with answers and textbook citations.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-primary">
              <span>Practice Set</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* AI Tutor */}
          <Link
            to="/student/ai-tutor"
            className="group relative flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-tertiary-container to-tertiary text-white shadow-md">
                  <MessageSquare size={22} />
                </div>
                <span className="rounded-full bg-tertiary-container/15 px-3 py-1 text-xs font-semibold text-tertiary">
                  24/7 AI Assistant
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-on-surface group-hover:text-primary transition">
                AI Tutor Chat
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                Ask questions and clarify course concepts with cited answers from your curriculum.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-primary">
              <span>Ask AI Tutor</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Main Grid: Agenda & Upcoming Exams */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Active Study Agenda */}
        <section className="space-y-4 rounded-3xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Active Study Agenda</h2>
              <p className="text-xs text-on-surface-variant">Topics assigned based on your current weak areas</p>
            </div>
            <Link to="/student/learning-path" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {agenda.map((item, idx) => (
              <div
                key={item.topic || idx}
                className="flex items-center justify-between rounded-xl border border-surface-variant/30 bg-surface-container p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-container/20 font-bold text-xs text-on-primary-container">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm text-on-surface">{item.topic}</h3>
                    <p className="text-xs text-on-surface-variant">{item.subject || 'Coursework'}</p>
                  </div>
                </div>
                <Link
                  to={`/student/practice-mcq?topic=${encodeURIComponent(item.topic)}`}
                  className="rounded-lg bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary-container/15"
                >
                  Practice
                </Link>
              </div>
            ))}

            {agenda.length === 0 && (
              <div className="rounded-xl border border-dashed border-surface-variant/40 p-8 text-center text-on-surface-variant">
                <CheckCircle2 className="mx-auto mb-2 text-primary" size={24} />
                <p className="text-sm">No weak topics pending! Take a mock test to refresh your plan.</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Exam Timetable */}
        <section className="space-y-4 rounded-3xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Upcoming Exam Schedule</h2>
              <p className="text-xs text-on-surface-variant">Department timetable for this semester</p>
            </div>
          </div>

          <div className="space-y-3">
            {exams.map((exam, idx) => (
              <div
                key={exam._id || idx}
                className="flex items-center justify-between rounded-xl border border-surface-variant/30 bg-surface-container p-4"
              >
                <div>
                  <h3 className="font-semibold text-sm text-on-surface">{exam.subject}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {exam.exam_type || 'Internal'} · Venue: {exam.venue || 'Main Hall'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-on-primary-container">
                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'TBD'}
                  </p>
                  <p className="text-xs text-outline">{exam.time_slot || '09:00 AM'}</p>
                </div>
              </div>
            ))}

            {exams.length === 0 && (
              <div className="rounded-xl border border-dashed border-surface-variant/40 p-8 text-center text-on-surface-variant">
                <Calendar className="mx-auto mb-2 text-outline" size={24} />
                <p className="text-sm">No upcoming exams published yet for your department.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
