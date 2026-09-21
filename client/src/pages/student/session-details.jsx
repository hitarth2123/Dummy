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

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="animate-spin text-primary" /></div>;
  if (error || !session) return <section className="space-y-4"><Link to="/student/my-sessions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={16} /> Back to my sessions</Link><p className="rounded-xl border border-error/20 bg-error-container/15 p-4 text-sm text-error">{error || 'Session not found.'}</p></section>;

  const browserMeetingLink = `https://meet.jit.si/AI-Buddy-${String(session._id).slice(-12)}`;
  const isZoom = session.meeting_link?.includes('zoom.us');
  return <section className="mx-auto max-w-3xl space-y-6"><Link to="/student/my-sessions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-on-primary-container"><ArrowLeft size={16} /> Back to my sessions</Link><header className="rounded-3xl bg-ink p-6 text-white shadow-panel sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Faculty support session</p><h1 className="mt-2 text-3xl font-bold">{session.subject}</h1><p className="mt-1 text-outline">{session.topic || 'Doubt session'}</p></div><span className="rounded-full bg-surface-container-low/10 px-3 py-1 text-sm font-semibold capitalize">{session.status}</span></div></header><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel"><UserRound className="text-primary" size={20} /><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-outline">Faculty</p><p className="mt-1 font-semibold text-on-surface">{session.faculty?.name || 'Faculty member'}</p><p className="text-sm text-on-surface-variant">{session.faculty?.email || ''}</p></div><div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel"><Calendar className="text-primary" size={20} /><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-outline">Scheduled time</p><p className="mt-1 font-semibold text-on-surface">{new Date(session.scheduled_at).toLocaleString()}</p><p className="flex items-center gap-1 text-sm text-on-surface-variant"><Clock size={14} /> {session.duration_minutes} minutes</p></div></div><article className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel"><h2 className="text-lg font-bold text-on-surface">Session details</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{session.description}</p>{session.decline_reason && <p className="mt-4 rounded-xl bg-error-container/15 p-4 text-sm text-error">Decline reason: {session.decline_reason}</p>}{session.meeting_link ? <><a href={session.meeting_link} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-semibold text-white hover:bg-inverse-primary"><ExternalLink size={16} /> {isZoom ? 'Open Zoom meeting' : 'Open meeting'}</a><a href={browserMeetingLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-container/15 px-5 py-3 text-sm font-semibold text-on-primary-container hover:bg-primary-container/20"><ExternalLink size={16} /> Join browser room</a></> : <p className="mt-5 rounded-xl bg-surface-container p-4 text-sm text-on-surface-variant">The meeting link will appear here after the faculty confirms the session.</p>}</article></section>;
}
