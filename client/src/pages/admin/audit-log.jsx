import { useEffect, useState } from 'react';
import { FileText, RefreshCw, ShieldAlert } from 'lucide-react';
import { adminService } from '@services/api.service';

const formatDetails = (log) => {
  if (log.action === 'distress_escalated') return log.metadata?.student_message || 'Student wellbeing alert';
  if (log.metadata?.prompt_length) return `LLM request (${log.metadata.prompt_length} characters)`;
  if (log.metadata?.reason) return log.metadata.reason;
  return log.action.replaceAll('_', ' ');
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = () => {
    setLoading(true);
    setError('');
    adminService.getAuditLog({ severity: severity || undefined })
      .then((response) => setLogs(response.data || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Audit log could not be loaded.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, [severity]);

  return <section className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Governance</p><h1 className="mt-2 text-3xl font-semibold text-white">Audit log</h1><p className="mt-1 text-sm text-slate-400">Immutable platform activity, including student wellbeing escalations.</p></div><div className="flex items-center gap-3"><select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-md border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white"><option value="">All severity</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select><button type="button" onClick={loadLogs} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200"><RefreshCw size={15} /> Refresh</button></div></header>{error && <p className="rounded-md border border-rose-300/25 bg-rose-950/30 p-3 text-sm text-rose-100">{error}</p>}<div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950/55 shadow-panel"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Timestamp</th><th className="p-4">Actor</th><th className="p-4">Action</th><th className="p-4">Department</th><th className="p-4">Details</th><th className="p-4">Severity</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading audit records...</td></tr> : logs.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-500">No audit records found.</td></tr> : logs.map((log) => <tr key={log._id} className="border-b border-white/5 align-top last:border-0"><td className="p-4 whitespace-nowrap text-slate-400">{new Date(log.createdAt).toLocaleString()}</td><td className="p-4"><p className="font-semibold text-white">{log.actor?.name || 'System'}</p><p className="text-xs capitalize text-slate-500">{log.actor?.role || log.actor_role}</p></td><td className="p-4"><span className="inline-flex items-center gap-2 font-medium text-slate-200">{log.action === 'distress_escalated' && <ShieldAlert size={15} className="text-rose-300" />}{log.action.replaceAll('_', ' ')}</span></td><td className="p-4 text-slate-400">{log.department || 'Institutional'}</td><td className="max-w-[420px] p-4 text-slate-300">{formatDetails(log)}{log.action === 'distress_escalated' && log.metadata?.ai_response && <details className="mt-2"><summary className="cursor-pointer text-xs text-cyan-200">View AI response and profile</summary><div className="mt-2 space-y-1 rounded-md bg-white/5 p-2 text-xs"><p><strong>AI response:</strong> {log.metadata.ai_response}</p><p><strong>Student:</strong> {log.metadata.student_profile?.name} · {log.metadata.student_profile?.email}</p></div></details>}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${log.severity === 'critical' ? 'bg-rose-300/10 text-rose-200' : log.severity === 'warning' ? 'bg-amber-300/10 text-amber-200' : 'bg-cyan-300/10 text-cyan-200'}`}>{log.severity}</span></td></tr>)}</tbody></table></div><p className="flex items-center gap-2 text-xs text-slate-500"><FileText size={14} /> Audit records are read-only and cannot be edited or deleted.</p></section>;
}
