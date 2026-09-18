import React, { useEffect, useState } from 'react';
import { hodService } from '@services/api.service';

const AuditLog = () => {
	const [logs, setLogs] = useState([]);
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const load = () => {
		setLoading(true);
		setError('');
		hodService.getAuditLog()
			.then((result) => setLogs(Array.isArray(result.data) ? result.data : []))
			.catch((requestError) => setError(requestError.response?.data?.message || 'Audit log could not be loaded.'))
			.finally(() => setLoading(false));
	};

	useEffect(() => { load(); }, []);

	const act = async (id, action) => {
		try {
			await hodService.auditAction(id, action);
			setMessage(`Marked as ${action.replace('_', ' ')}.`);
			load();
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'Audit action could not be completed.');
		}
	};

	return (
		<section className="space-y-6">
			<div>
				<h1 className="text-3xl font-semibold tracking-tight text-on-surface">Audit log</h1>
				<p className="mt-2 text-on-surface-variant">Review actions append a new record; original records remain immutable.</p>
			</div>
			{error && <p role="alert" className="rounded-xl border border-error/20 bg-error-container/15 p-4 text-sm text-error">{error}</p>}
			<div className="overflow-x-auto rounded-2xl border border-surface-variant/40 bg-surface-container-low shadow-panel">
				<table className="w-full min-w-[760px] text-left text-sm">
					<thead className="border-b bg-surface-container text-xs uppercase text-on-surface-variant">
						<tr><th className="p-4">Timestamp</th><th className="p-4">Request</th><th className="p-4">Flag</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
					</thead>
					<tbody>
						{loading && <tr><td colSpan="5" className="p-10 text-center text-on-surface-variant">Loading audit records...</td></tr>}
						{!loading && !error && logs.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-on-surface-variant">No audit records found for this department.</td></tr>}
						{!loading && logs.map((log) => (
							<tr key={log.id} className="border-b last:border-0">
								<td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
								<td className="p-4">{log.request_summary}</td>
								<td className="p-4">{log.flag_category || '-'}</td>
								<td className="p-4 capitalize">{log.status}</td>
								<td className="flex gap-2 p-4">
									<button type="button" onClick={() => act(log.id, 'reviewed')} className="rounded border px-2 py-1">Reviewed</button>
									<button type="button" onClick={() => act(log.id, 'false_positive')} className="rounded border border-amber-300/30 px-2 py-1 text-amber-200">False Positive</button>
									<button type="button" onClick={() => act(log.id, 'escalate')} className="rounded bg-rose-500/20 px-2 py-1 text-rose-100">Escalate</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{message && <p className="text-sm text-emerald-300">{message}</p>}
		</section>
	);
};

export default AuditLog;
