import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, LockKeyhole, MessageSquareText, Send, UserRound, XCircle } from 'lucide-react';
import { studentService } from '@services/api.service';

const requestDefaults = { change_field: '', proposed_value: '', reason: '' };

const statusStyles = {
  pending: 'bg-secondary/15 text-secondary',
  approved: 'bg-primary/15 text-primary',
  rejected: 'bg-error/15 text-error',
};

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestForm, setRequestForm] = useState(requestDefaults);
  const [requesting, setRequesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRequests = () => studentService.getProfileChangeRequests().then((result) => setRequests(result.data || result));

  useEffect(() => {
    Promise.all([studentService.getProfile(), loadRequests()])
      .then(([profileResult]) => setProfile(profileResult.data || profileResult))
      .catch(() => setError('Unable to load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  const submitRequest = async (event) => {
    event.preventDefault();
    setRequesting(true);
    setMessage('');
    setError('');
    try {
      const result = await studentService.createProfileChangeRequest(requestForm);
      setRequests((current) => [result.data, ...current]);
      setRequestForm(requestDefaults);
      setMessage(result.message || 'Your request was sent to the department faculty.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send your profile change request.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <section className="grid min-h-64 place-items-center text-sm text-on-surface-variant">Loading profile...</section>;

  const currentProfile = profile || {};
  const pendingRequest = requests.find((request) => request.status === 'pending');

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-on-surface">Settings</h1>
        <p className="mt-2 text-sm text-on-surface-variant">View your student profile and request changes from department faculty.</p>
      </header>

      {message && <p className="rounded-lg bg-primary-container/15 p-3 text-sm text-on-primary-container">{message}</p>}
      {error && <p className="rounded-lg bg-error/10 p-3 text-sm text-error">{error}</p>}

      <section className="max-w-3xl rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
        <div className="flex items-center gap-3 border-b border-surface-variant/30 pb-5">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary"><UserRound size={23} /></div>
          <div><h2 className="font-semibold text-on-surface">Personal information</h2><p className="text-sm text-on-surface-variant">Details maintained by your institution</p></div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><p className="mb-2 text-sm font-semibold text-on-surface">Full name</p><p className="rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface">{currentProfile.name || 'Not provided'}</p></div>
          <div><p className="mb-2 text-sm font-semibold text-on-surface">Email</p><div className="relative"><p className="rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 pr-10 text-sm text-on-surface opacity-70">{currentProfile.email || 'Not provided'}</p><LockKeyhole size={16} className="absolute right-3 top-3 text-outline" /></div></div>
          <div><p className="mb-2 text-sm font-semibold text-on-surface">Department</p><p className="rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface">{currentProfile.department || 'Not provided'}</p></div>
          <div><p className="mb-2 text-sm font-semibold text-on-surface">Course</p><p className="rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface">{currentProfile.course || 'Not provided'}</p></div>
          <div><p className="mb-2 text-sm font-semibold text-on-surface">Semester</p><p className="rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface">{currentProfile.semester ? `Semester ${currentProfile.semester}` : 'Not provided'}</p></div>
          <div><p className="mb-2 text-sm font-semibold text-on-surface">Specialization</p><p className="rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface">{currentProfile.specialization || 'Not provided'}</p></div>
        </div>
        {currentProfile.enrolled_subjects?.length > 0 && <div className="mt-6 border-t border-surface-variant/30 pt-5"><p className="text-sm font-semibold text-on-surface">Enrolled subjects</p><div className="mt-3 flex flex-wrap gap-2">{currentProfile.enrolled_subjects.map((subject) => <span key={subject} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{subject}</span>)}</div></div>}
      </section>

      <form onSubmit={submitRequest} className="max-w-3xl rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
        <div className="flex items-center gap-3 border-b border-surface-variant/30 pb-5"><div className="grid h-10 w-10 place-items-center rounded-full bg-secondary/15 text-secondary"><MessageSquareText size={20} /></div><div><h2 className="font-semibold text-on-surface">Request a profile change</h2><p className="text-sm text-on-surface-variant">A faculty member will review your request before anything is changed.</p></div></div>
        <div className="mt-5 grid gap-4">
          <label className="block"><span className="mb-2 block text-sm font-semibold text-on-surface">What should be changed?</span><select required value={requestForm.change_field} onChange={(event) => setRequestForm({ ...requestForm, change_field: event.target.value })} className="w-full rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm"><option value="">Select a profile field</option><option value="name">Full name</option><option value="email">Email</option><option value="department">Department</option><option value="course">Course</option><option value="semester">Semester</option><option value="specialization">Specialization</option></select><textarea required maxLength={500} value={requestForm.proposed_value} onChange={(event) => setRequestForm({ ...requestForm, proposed_value: event.target.value })} placeholder="Enter the correct or requested value" className="mt-3 min-h-20 w-full rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-on-surface">Why should it be changed?</span><textarea required maxLength={2000} value={requestForm.reason} onChange={(event) => setRequestForm({ ...requestForm, reason: event.target.value })} placeholder="Explain the reason and include any useful context for faculty review." className="min-h-24 w-full rounded-lg border border-surface-variant/40 bg-surface-container px-3 py-2.5 text-sm" /></label>
          <button type="submit" disabled={requesting || Boolean(pendingRequest)} className="inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"><Send size={16} />{requesting ? 'Sending...' : pendingRequest ? 'Request awaiting review' : 'Send request to faculty'}</button>
        </div>
      </form>

      {requests.length > 0 && <section className="max-w-3xl space-y-3"><h2 className="font-semibold text-on-surface">Your requests</h2>{requests.map((request) => <article key={request._id} className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-on-surface">Profile change request</p><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[request.status]}`}>{request.status === 'pending' ? <Clock3 size={13} /> : request.status === 'approved' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{request.status}</span></div><p className="mt-3 text-sm text-on-surface-variant"><strong>What:</strong> {request.requested_changes}</p><p className="mt-2 text-sm text-on-surface-variant"><strong>Why:</strong> {request.reason}</p>{request.review_notes && <p className="mt-2 text-sm text-on-surface-variant"><strong>Faculty note:</strong> {request.review_notes}</p>}</article>)}</section>}
    </section>
  );
};

export default Settings;
