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

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="animate-spin text-teal-700" /></div>;

  return (
    <section className="space-y-6">
      <header><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Faculty workspace</p><h1 className="mt-1 text-3xl font-bold text-ink">My sessions</h1><p className="mt-1 text-sm text-slate-500">Open confirmed sessions from here.</p></header>
      <div className="space-y-3">
        {sessions.map((session) => {
          const browserMeetingLink = `https://meet.jit.si/AI-Buddy-${String(session._id).slice(-12)}`;
          return <article key={session._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-ink">{session.subject} · {session.topic || 'Doubt session'}</h2><p className="text-sm text-slate-500">{session.student?.name} · {new Date(session.scheduled_at).toLocaleString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{session.status}</span></div>
            {session.status === 'confirmed' && <div className="mt-4 flex flex-wrap gap-2">{session.meeting_link && <a href={session.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800"><ExternalLink size={14} /> Open Zoom meeting</a>}<a href={browserMeetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"><ExternalLink size={14} /> Join browser room</a></div>}
            <div className="mt-4 flex gap-2"><input defaultValue={session.faculty_notes || ''} id={`notes-${session._id}`} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Session notes" /><button type="button" onClick={() => updateNotes(session._id, document.getElementById(`notes-${session._id}`).value)} className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white"><Save size={14} /> Save</button></div>
          </article>;
        })}
        {sessions.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No sessions yet.</p>}
      </div>
    </section>
  );
}
