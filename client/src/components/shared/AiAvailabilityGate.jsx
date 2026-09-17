import { useEffect, useState } from 'react';
import { Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import { aiAvailabilityService } from '@services/api.service';

const labels = {
  mock_test: 'Mock tests',
  learning_path: 'Learning paths',
  question_bank: 'Question bank',
  practice_mcq: 'Practice MCQs',
  private_forum: 'Private forum',
  booking_session: 'Session booking',
};

export default function AiAvailabilityGate({ feature, children }) {
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState('');

  const load = () => aiAvailabilityService.get().then((response) => setAvailability(response.data)).catch(() => setError('Availability status could not be loaded.'));
  useEffect(() => { load(); }, []);

  if (error) return <section className="rounded-lg border border-rose-300/25 bg-rose-950/30 p-6 text-rose-100"><p>{error}</p><button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm"><RefreshCw size={15} /> Retry</button></section>;
  if (!availability) return <div className="flex min-h-[260px] items-center justify-center text-slate-400">Checking feature availability...</div>;

  const selected = availability.features?.[feature];
  const enabled = availability.ai_enabled !== false && selected?.enabled !== false;
  if (enabled) return children;

  const resumeAt = selected?.resume_at || availability.ai_resume_at;
  return <section className="mx-auto flex min-h-[calc(100vh-13rem)] max-w-2xl items-center justify-center"><div className="w-full rounded-lg border border-amber-300/25 bg-gradient-to-br from-amber-950/40 via-slate-950/80 to-cyan-950/30 p-8 text-center shadow-panel sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-300/10 text-amber-200"><Clock3 size={30} /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Temporarily paused</p><h1 className="mt-3 text-3xl font-semibold text-white">{labels[feature] || 'This feature'} is taking a short pause</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-300">{selected?.message || availability.ai_message || 'An administrator or HOD has paused this AI feature. You can return when it is available again.'}</p>{resumeAt ? <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-amber-100"><Clock3 size={15} />Expected back {new Date(resumeAt).toLocaleString()}</p> : <p className="mt-5 text-sm text-slate-500">No resume time has been set yet.</p>}<div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldAlert size={14} />Emergency and safety support remain available.</div><button type="button" onClick={load} className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200"><RefreshCw size={15} /> Check again</button></div></section>;
}
