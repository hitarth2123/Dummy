import React, { useEffect, useState } from 'react';
import { CalendarCheck, LoaderCircle, Users, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { facultyService } from '@services/api.service';

export default function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => facultyService.getDashboard().then((res) => setData(res.data || res)).finally(() => setLoading(false));
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 shadow-sm">
            <Sparkles size={14} className="text-secondary" />
            <span className="text-primary-fixed">Faculty Portal</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Faculty <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">Dashboard</span>
          </h1>
          <p className="mt-2 text-on-surface-variant font-medium text-sm sm:text-base">
            Manage your availability schedule and respond to student 1-on-1 doubt clearing requests.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-container/15 text-primary">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Pending Requests</p>
              <p className="text-2xl font-bold text-on-surface">{data?.pending_requests || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary-container/15 text-secondary">
              <CalendarCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Today's Sessions</p>
              <p className="text-2xl font-bold text-on-surface">{data?.today_sessions?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Current Availability</p>
              <p className="text-lg font-bold text-on-surface">{data?.availability?.is_available === false ? 'Unavailable' : 'Available'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
        <h2 className="text-lg font-bold text-on-surface">Today’s Confirmed Sessions</h2>
        <div className="mt-4 space-y-3">
          {(data?.today_sessions || []).map((session) => (
            <div key={session._id} className="flex justify-between items-center rounded-xl border border-surface-variant/30 bg-surface-container p-4 text-sm">
              <span className="font-semibold text-on-surface">{session.student?.name} · {session.subject}</span>
              <span className="text-on-surface-variant">{new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {!data?.today_sessions?.length && (
            <div className="rounded-xl border border-dashed border-surface-variant/40 p-6 text-center text-on-surface-variant">
              <CheckCircle2 className="mx-auto mb-2 text-primary" size={24} />
              <p className="text-sm">No confirmed sessions today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
