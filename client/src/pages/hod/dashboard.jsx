import { useEffect, useState } from 'react';
import { ClipboardList, FileClock, RefreshCw, ShieldCheck } from 'lucide-react';
import { hodService } from '@services/api.service';

export default function HODDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { const load = () => hodService.getDashboard().then((result) => setData(result.data)).catch(() => setError('HOD dashboard data could not be loaded.')); load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, []);
  if (error) return <section className="rounded-xl border border-rose-300/30 p-6 text-rose-100">{error}</section>;
  if (!data) return <section className="rounded-xl border border-white/10 p-6 text-slate-300">Loading dashboard...</section>;
  const cards = [{ label: 'Pending profile appeals', value: data.pending_profile_requests, icon: ClipboardList }, { label: 'Audit events this week', value: data.recent_audit_events, icon: FileClock }, { label: 'Active ethics version', value: data.ethics_config_version, icon: ShieldCheck }];
  return <section className="space-y-6"><header className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-primary">Department overview</p><h1 className="mt-2 text-3xl font-bold text-white">HOD dashboard</h1><p className="mt-2 text-sm text-slate-400">Live department governance and appeal activity.</p></div><button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm text-slate-200"><RefreshCw size={15} />Refresh</button></header><div className="grid gap-4 sm:grid-cols-3">{cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-white/10 bg-slate-950/55 p-5"><Icon className="text-cyan-300" size={20} /><p className="mt-4 text-sm text-slate-400">{label}</p><p className="mt-1 text-3xl font-semibold text-white">{value}</p></article>)}</div></section>;
}
