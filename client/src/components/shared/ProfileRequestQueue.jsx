import { useEffect, useState } from 'react';

export default function ProfileRequestQueue({ service, title, subtitle, actions, actionableStatus }) {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const load = () => service.list().then((result) => setRequests(result.data || [])).catch(() => setMessage('Unable to load profile requests.'));
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);
  const review = async (id, action) => { try { await service.review(id, { action }); setMessage(`Request ${action}d.`); load(); } catch (error) { setMessage(error.response?.data?.message || 'Unable to review request.'); } };
  return <section className="space-y-6"><header><h1 className="text-3xl font-bold text-on-surface">{title}</h1><p className="mt-2 text-sm text-on-surface-variant">{subtitle}</p></header>{message && <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{message}</p>}<div className="space-y-3">{requests.length === 0 && <p className="rounded-xl border border-surface-variant/40 p-5 text-sm text-on-surface-variant">No profile requests are visible for your role.</p>}{requests.map((request) => <article key={request._id} className="rounded-xl border border-surface-variant/40 bg-surface-container-low p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold text-on-surface">{request.student?.name || 'User'}</h2><p className="text-xs text-on-surface-variant">{request.student?.email} · {request.requester_role} · {request.change_field}</p></div><span className="text-xs uppercase text-primary">{request.status}</span></div><p className="mt-4 text-sm text-on-surface-variant"><strong>Requested:</strong> {request.proposed_value}</p><p className="mt-1 text-sm text-on-surface-variant"><strong>Reason:</strong> {request.reason}</p>{request.status === actionableStatus && <div className="mt-4 flex flex-wrap gap-2">{actions.map((action) => <button key={action} onClick={() => review(request._id, action)} className="rounded-md border border-surface-variant/50 px-3 py-2 text-xs font-semibold text-on-surface">{action === 'escalate' ? 'Escalate upward' : action[0].toUpperCase() + action.slice(1)}</button>)}</div>}</article>)}</div></section>;
}