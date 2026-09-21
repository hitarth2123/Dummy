import React, { useEffect, useState } from 'react';
import { ExternalLink, LoaderCircle, Save } from 'lucide-react';
import { facultyService } from '@services/api.service';

export default function FacultyMySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyService.getSessions().then((res) => setSessions(res.data || res)).finally(() => setLoading(false));
  }, []);

  const updateNotes = async (id, notes) => {
    const result = await facultyService.updateRequest(id, { faculty_notes: notes });
    setSessions((current) => current.map((session) => session._id === id ? (result.data || { ...session, faculty_notes: notes }) : session));
  };

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="animate-spin text-primary" /></div>;

  return (
    <section className="space-y-6">
      <header><p className="text-xs font-semibold uppercase tracking-wider text-primary">Faculty workspace</p><h1 className="mt-1 text-3xl font-bold text-on-surface">My sessions</h1><p className="mt-1 text-sm text-on-surface-variant">Open confirmed sessions from here.</p></header>
      <div className="space-y-3">
        {sessions.map((session) => {
          const browserMeetingLink = `https://meet.jit.si/AI-Buddy-${String(session._id).slice(-12)}`;
          return <article key={session._id} className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-on-surface">{session.subject} · {session.topic || 'Doubt session'}</h2><p className="text-sm text-on-surface-variant">{session.student?.name} · {new Date(session.scheduled_at).toLocaleString()}</p></div><span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold capitalize text-on-surface-variant">{session.status}</span></div>
            {session.status === 'confirmed' && <div className="mt-4 flex flex-wrap gap-2">{session.meeting_link && <a href={session.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-xs font-semibold text-white hover:bg-inverse-primary"><ExternalLink size={14} /> Open Zoom meeting</a>}<a href={browserMeetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-container/15 px-4 py-2.5 text-xs font-semibold text-on-primary-container hover:bg-primary-container/20"><ExternalLink size={14} /> Join browser room</a></div>}
            <div className="mt-4 flex gap-2"><input defaultValue={session.faculty_notes || ''} id={`notes-${session._id}`} className="min-w-0 flex-1 rounded-xl border border-surface-variant/40 px-3 py-2 text-sm" placeholder="Session notes" /><button type="button" onClick={() => updateNotes(session._id, document.getElementById(`notes-${session._id}`).value)} className="inline-flex items-center gap-1 rounded-xl bg-primary-container px-3 py-2 text-xs font-semibold text-white"><Save size={14} /> Save</button></div>
          </article>;
        })}
        {sessions.length === 0 && <p className="rounded-xl border border-dashed border-surface-variant/50 p-8 text-center text-sm text-on-surface-variant">No sessions yet.</p>}
      </div>
    </section>
  );
}
