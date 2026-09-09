import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, ExternalLink, LoaderCircle, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { studentService } from '@services/api.service';

export default function SessionDetails() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    studentService.getSessions().then((result) => {
      const found = (result.data || result).find((item) => item._id === id);
      if (found) setSession(found); else setError('Session not found.');
    }).catch((requestError) => setError(requestError.response?.data?.message || 'Could not load session details.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="animate-spin text-teal-700" /></div>;
  if (error || !session) return <section className="space-y-4"><Link to="/student/my-sessions" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700"><ArrowLeft size={16} /> Back to my sessions</Link><p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error || 'Session not found.'}</p></section>;

  const browserMeetingLink = `https://meet.jit.si/AI-Buddy-${String(session._id).slice(-12)}`;
  const isZoom = session.meeting_link?.includes('zoom.us');
  return <section className="mx-auto max-w-3xl space-y-6"><Link to="/student/my-sessions" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"><ArrowLeft size={16} /> Back to my sessions</Link><header className="rounded-3xl bg-ink p-6 text-white shadow-panel sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Faculty support session</p><h1 className="mt-2 text-3xl font-bold">{session.subject}</h1><p className="mt-1 text-slate-300">{session.topic || 'Doubt session'}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold capitalize">{session.status}</span></div></header><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><UserRound className="text-teal-700" size={20} /><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Faculty</p><p className="mt-1 font-semibold text-ink">{session.faculty?.name || 'Faculty member'}</p><p className="text-sm text-slate-500">{session.faculty?.email || ''}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel"><Calendar className="text-teal-700" size={20} /><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Scheduled time</p><p className="mt-1 font-semibold text-ink">{new Date(session.scheduled_at).toLocaleString()}</p><p className="flex items-center gap-1 text-sm text-slate-500"><Clock size={14} /> {session.duration_minutes} minutes</p></div></div><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel"><h2 className="text-lg font-bold text-ink">Session details</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{session.description}</p>{session.decline_reason && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Decline reason: {session.decline_reason}</p>}{session.meeting_link ? <><a href={session.meeting_link} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"><ExternalLink size={16} /> {isZoom ? 'Open Zoom meeting' : 'Open meeting'}</a><a href={browserMeetingLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-100"><ExternalLink size={16} /> Join browser room</a></> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">The meeting link will appear here after the faculty confirms the session.</p>}</article></section>;
}
