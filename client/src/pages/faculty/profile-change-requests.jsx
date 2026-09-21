import React, { useEffect, useState } from 'react';
import { Check, Clock3, LoaderCircle, X } from 'lucide-react';
import { facultyService } from '@services/api.service';

const ProfileChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    facultyService.getProfileChangeRequests().then((result) => setRequests(result.data || result)).catch(() => setMessage('Unable to load profile change requests.')).finally(() => setLoading(false));
  }, []);

  const review = async (id, action) => {
    try {
      const result = await facultyService.reviewProfileChangeRequest(id, { action, review_notes: notes });
      setRequests((current) => current.map((request) => request._id === id ? (result.data || request) : request));
      setReviewing(null);
      setNotes('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to review request.');
    }
  };

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="animate-spin text-primary" /></div>;

  return <section className="space-y-6"><header><p className="text-xs font-semibold uppercase tracking-wider text-primary">Faculty workspace</p><h1 className="mt-1 text-3xl font-bold text-on-surface">Profile change requests</h1><p className="mt-2 text-sm text-on-surface-variant">Review student requests before profile information is changed.</p></header>{message && <p className="rounded-xl bg-error-container/15 p-4 text-sm text-error">{message}</p>}<div className="space-y-3">{requests.map((request) => <article key={request._id} className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold text-on-surface">{request.student?.name || 'Student'} <span className="font-normal text-on-surface-variant">· {request.student?.email}</span></p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{request.status}</p></div><p className="text-xs text-outline">{new Date(request.createdAt).toLocaleString()}</p></div><div className="mt-4 space-y-2 text-sm text-on-surface-variant"><p><strong>What to change:</strong> {request.requested_changes}</p><p><strong>Why:</strong> {request.reason}</p>{request.review_notes && <p><strong>Review note:</strong> {request.review_notes}</p>}</div>{request.status === 'pending' && <div className="mt-4 border-t border-surface-variant/30 pt-4">{reviewing === request._id && <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional note for the student" className="mb-3 min-h-20 w-full rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm" />}<div className="flex flex-wrap gap-2"><button type="button" onClick={() => reviewing === request._id ? review(request._id, 'approve') : setReviewing(request._id)} className="inline-flex items-center gap-1 rounded-lg bg-primary-container px-3 py-2 text-xs font-semibold text-white"><Check size={14} /> Approve</button><button type="button" onClick={() => reviewing === request._id ? review(request._id, 'reject') : setReviewing(request._id)} className="inline-flex items-center gap-1 rounded-lg bg-error px-3 py-2 text-xs font-semibold text-white"><X size={14} /> Reject</button>{reviewing === request._id && <button type="button" onClick={() => { setReviewing(null); setNotes(''); }} className="inline-flex items-center gap-1 rounded-lg border border-surface-variant/50 px-3 py-2 text-xs font-semibold text-on-surface-variant"><Clock3 size={14} /> Cancel</button>}</div></div>}</article>)}</div>{requests.length === 0 && <p className="rounded-xl border border-dashed border-surface-variant/50 p-8 text-center text-sm text-on-surface-variant">No profile change requests.</p>}</section>;
};

export default ProfileChangeRequests;
