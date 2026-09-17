import { useEffect, useState } from 'react';
import { Activity, BookOpen, MessageSquare, RefreshCw, UserRound } from 'lucide-react';
import { adminService } from '@services/api.service';

const formatDate = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available';

export default function StudentActivity() {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState('');

  const loadActivity = () => {
    setError('');
    adminService.getStudentActivity().then((response) => setActivity(response.data)).catch((requestError) => setError(requestError.response?.data?.message || 'Student activity could not be loaded.'));
  };

  useEffect(() => { loadActivity(); }, []);

  if (error) return <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-6 text-rose-100"><p>{error}</p><button type="button" onClick={loadActivity} className="mt-4 inline-flex items-center gap-2 rounded bg-rose-400/15 px-3 py-2 text-sm"><RefreshCw size={15} /> Retry</button></section>;
  if (!activity) return <section className="rounded-lg border border-white/10 bg-slate-950/50 p-6 text-slate-300">Loading student activity...</section>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Read-only oversight</p><h1 className="mt-2 text-3xl font-semibold text-white">Student activity</h1><p className="mt-1 text-sm text-slate-400">Review active learning workflows and recent AI tutor conversations.</p></div>
        <button type="button" onClick={loadActivity} className="inline-flex items-center gap-2 rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"><RefreshCw size={15} /> Refresh</button>
      </header>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-cyan-300/20 bg-slate-950/55 p-5 shadow-panel"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-white"><BookOpen size={19} className="text-cyan-300" /> Active workflows</h2><p className="mt-1 text-sm text-slate-400">Learning paths that still have unfinished topics.</p></div><span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">{activity.active_workflows.length}</span></div><div className="mt-5 space-y-3">{activity.active_workflows.length === 0 ? <p className="rounded-md border border-dashed border-white/15 p-4 text-sm text-slate-500">No active workflows found.</p> : activity.active_workflows.map((workflow) => <article key={workflow._id} className="rounded-md border border-white/10 bg-white/[0.03] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{workflow.student?.name || 'Unknown student'}</h3><p className="text-xs text-slate-500">{workflow.student?.email || 'No email'} · {workflow.department}</p></div><span className="text-sm font-semibold text-cyan-200">{workflow.overall_progress_pct}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${workflow.overall_progress_pct}%` }} /></div><p className="mt-3 text-sm text-slate-300"><span className="text-slate-500">{workflow.subject}:</span> {workflow.active_topic?.topic || 'Next topic pending'}</p><p className="mt-1 text-xs text-slate-500">Updated {formatDate(workflow.updatedAt)}</p></article>)}</div></div>

        <div className="rounded-lg border border-violet-300/20 bg-slate-950/55 p-5 shadow-panel"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-semibold text-white"><MessageSquare size={19} className="text-violet-300" /> Student AI tutor chat</h2><p className="mt-1 text-sm text-slate-400">Recent conversations and the latest exchanged messages.</p></div><span className="rounded-full bg-violet-300/10 px-2.5 py-1 text-xs font-semibold text-violet-200">{activity.conversations.length}</span></div><div className="mt-5 space-y-3">{activity.conversations.length === 0 ? <p className="rounded-md border border-dashed border-white/15 p-4 text-sm text-slate-500">No tutor conversations found.</p> : activity.conversations.map((conversation) => <article key={conversation._id} className="rounded-md border border-white/10 bg-white/[0.03] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{conversation.title}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><UserRound size={12} /> {conversation.user?.name || 'Unknown student'} · {conversation.user?.department || 'No department'}</p></div><span className="text-xs text-slate-500">{formatDate(conversation.updatedAt)}</span></div><div className="mt-3 space-y-2 border-l border-violet-300/30 pl-3">{conversation.messages.slice(-2).map((message, index) => <p key={`${conversation._id}-${index}`} className="text-sm leading-5 text-slate-300"><span className="mr-1 text-xs font-semibold uppercase text-violet-200">{message.role}</span>{message.content}</p>)}</div></article>)}</div></div>
      </section>

      <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-500"><Activity size={14} /> Admin access is read-only; students retain ownership of their tutor conversations and learning paths.</div>
    </div>
  );
}
