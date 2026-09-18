import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Clock3, Gauge, RefreshCw, ShieldAlert, Star } from 'lucide-react';
import { adminService } from '@services/api.service';

const cards = [
	{ key: 'active_sessions', label: 'Active sessions', icon: Activity, format: (value) => value.toLocaleString(), tone: 'text-cyan-300' },
	{ key: 'engagement_percent', label: 'Weekly engagement', icon: Gauge, format: (value) => `${value}%`, tone: 'text-emerald-300' },
	{ key: 'uptime_percent', label: 'Platform uptime', icon: Clock3, format: (value) => `${value}%`, tone: 'text-sky-300' },
	{ key: 'open_ethics_flags', label: 'Open ethics flags', icon: ShieldAlert, format: (value) => value.toLocaleString(), tone: 'text-amber-300' },
	{ key: 'hallucination_reports', label: 'Hallucination reports', icon: AlertTriangle, format: (value) => value.toLocaleString(), tone: 'text-rose-300' },
	{ key: 'average_feedback_rating', label: 'Average feedback', icon: Star, format: (value) => `${value}/5`, tone: 'text-violet-300' },
];

export default function AdminDashboard() {
	const [dashboard, setDashboard] = useState(null);
	const [error, setError] = useState('');

	const loadDashboard = () => {
		setError('');
		adminService.getDashboard().then((response) => setDashboard(response.data)).catch((requestError) => setError(requestError.response?.data?.message || 'Dashboard data could not be loaded.'));
	};

	useEffect(() => { loadDashboard(); const timer = setInterval(loadDashboard, 30000); return () => clearInterval(timer); }, []);

	if (error) return <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-6 text-rose-100"><p>{error}</p><button type="button" onClick={loadDashboard} className="mt-4 inline-flex items-center gap-2 rounded bg-rose-400/15 px-3 py-2 text-sm"><RefreshCw size={15} /> Retry</button></section>;
	if (!dashboard) return <section className="rounded-lg border border-white/10 bg-slate-950/50 p-6 text-slate-300">Loading dashboard...</section>;

	const trendMax = Math.max(...dashboard.weekly_trends.map((trend) => trend.feedback_rating), 5);
	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Operations overview</p><h1 className="mt-2 text-3xl font-semibold text-white">Admin dashboard</h1><p className="mt-1 text-sm text-slate-400">Live platform health and learning signals.</p></div>
				<button type="button" onClick={loadDashboard} className="inline-flex items-center gap-2 rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"><RefreshCw size={15} /> Refresh</button>
			</header>
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{cards.map(({ key, label, icon: Icon, format, tone }) => <article key={key} className="rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-panel"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><Icon size={18} className={tone} /></div><p className="mt-4 text-3xl font-semibold text-white">{format(dashboard[key])}</p></article>)}
			</section>
			<section className="rounded-lg border border-white/10 bg-slate-950/55 p-5 shadow-panel"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-white">Weekly feedback trend</h2><p className="text-sm text-slate-400">Average rating and submission volume across the last eight weeks.</p></div><Star size={20} className="text-violet-300" /></div><div className="mt-6 grid h-48 grid-cols-8 items-end gap-2 sm:gap-4">{dashboard.weekly_trends.map((trend) => <div key={trend.week_start} className="flex h-full flex-col items-center justify-end gap-2"><div title={`${trend.feedback_rating}/5`} className="w-full max-w-10 rounded-t bg-gradient-to-t from-cyan-400/80 to-violet-300/80" style={{ height: `${Math.max((trend.feedback_rating / trendMax) * 100, 3)}%` }} /><span className="text-[10px] text-slate-500">{new Date(trend.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>)}</div></section>
		</div>
	);
}
