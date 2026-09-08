import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentService } from '@services/api.service';

const LearningPath = () => {
  const [path, setPath] = useState({ topics: [] });
  useEffect(() => { studentService.getLearningPath().then((result) => setPath(result.data || result)); }, []);
  return <section className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Personal study plan</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Learning path</h1><p className="mt-2 text-slate-600">Your weakest areas are placed first, with progress you can build on.</p></div><div className="space-y-4">{(path.topics || []).map((topic) => <article key={`${topic.order}-${topic.topic}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 font-semibold text-teal-700">{topic.order}</span><div><h2 className="font-semibold text-ink">{topic.topic}</h2><p className="text-sm text-slate-500">{topic.subject} · estimated 30 minutes</p></div></div><Link to={`/student/practice-mcq?topic=${encodeURIComponent(topic.topic)}`} className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">Practice <ArrowRight size={16} /></Link></div><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-700" style={{ width: `${topic.status === 'completed' ? 100 : topic.status === 'in_progress' ? 50 : 0}%` }} /></div></article>)}{!path.topics?.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"><BookOpen className="mx-auto mb-3 text-teal-700" /><p>Complete a mock test to generate your learning path.</p></div>}</div></section>;
+};
+
+export default LearningPath;
