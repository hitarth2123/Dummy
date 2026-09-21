import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, LoaderCircle, Save, X } from 'lucide-react';
import { facultyService } from '@services/api.service';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

export default function Availability() {
  const [slots, setSlots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const dateForDay = (day) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + days.indexOf(day));
    return date;
  };

  useEffect(() => {
    Promise.all([facultyService.getAvailability(), facultyService.getSessions()])
      .then(([availabilityResult, sessionsResult]) => {
        const availability = availabilityResult.data || availabilityResult;
        setSlots(availability.slots || []);
        setIsAvailable(availability.is_available !== false);
        setSessions(sessionsResult.data || sessionsResult || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const getSlot = (day, time) => slots.find((slot) => slot.day_of_week === day && slot.start_time === time);
  const getSession = (slot) => sessions.find((session) => {
    const date = new Date(session.scheduled_at);
    return date.toLocaleDateString('en-US', { weekday: 'long' }) === slot.day_of_week
      && date.toTimeString().slice(0, 5) === slot.start_time;
  });

  const toggle = (day, time) => {
    const slot = getSlot(day, time);
    if (slot?.is_booked) {
      setSelectedSession(getSession(slot) || null);
      return;
    }
    setSlots((current) => slot
      ? current.filter((item) => !(item.day_of_week === day && item.start_time === time))
      : [...current, { day_of_week: day, start_time: time, end_time: `${String(Number(time.slice(0, 2)) + 1).padStart(2, '0')}:00`, is_booked: false }]);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const cleanSlots = slots.map((slot) => ({ ...slot, booked_by: slot.booked_by?._id || slot.booked_by || null }));
      await facultyService.saveAvailability({ slots: cleanSlots, is_available: isAvailable });
      setMessage('Availability saved.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save availability.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="animate-spin text-primary" /></div>;

  return (
    <section className="space-y-6">
      <header><p className="text-xs font-semibold uppercase tracking-wider text-primary">Faculty workspace</p><h1 className="mt-1 text-3xl font-bold text-on-surface">Set availability</h1><p className="mt-1 text-sm text-on-surface-variant">Booked cells stay visible here. Click one to open its session details with the booked date and time.</p></header>
      <div className="flex items-center justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-5 shadow-panel"><div><h2 className="font-bold text-on-surface">Accept new bookings</h2><p className="text-sm text-on-surface-variant">Students only see your slots when this is enabled.</p></div><button type="button" onClick={() => setIsAvailable((value) => !value)} className={`relative h-7 w-12 rounded-full ${isAvailable ? 'bg-primary-container' : 'bg-slate-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-surface-container-low transition ${isAvailable ? 'left-6' : 'left-1'}`} /></button></div>
      <div className="overflow-x-auto rounded-2xl border border-surface-variant/40 bg-surface-container-low p-4 shadow-panel"><div className="min-w-[760px] grid grid-cols-[120px_repeat(7,minmax(80px,1fr))] gap-2"><div />{days.map((day) => <div key={day} className="p-2 text-center text-xs font-bold text-on-surface-variant"><span className="block">{day.slice(0, 3)}</span><span className="mt-1 block text-[11px] font-medium text-outline">{dateForDay(day).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span></div>)}{times.map((time) => <React.Fragment key={time}><div className="p-3 text-xs font-semibold text-on-surface-variant">{time}</div>{days.map((day) => { const slot = getSlot(day, time); return <button type="button" key={`${day}-${time}`} onClick={() => toggle(day, time)} className={`min-h-14 rounded-xl border text-xs font-semibold ${slot?.is_booked ? 'border-indigo-300 bg-primary/10 text-indigo-300' : slot ? 'border-primary bg-primary-container/15 text-on-primary-container' : 'border-surface-variant/40 bg-surface-container text-outline'}`}>{slot?.is_booked ? <><span className="block">Booked</span><span className="mt-1 block truncate px-1 text-[10px]">{slot.booked_by?.name || 'Student'}</span></> : slot && <Check size={16} className="mx-auto" />}</button>; })}</React.Fragment>)}</div></div>
      {selectedSession && <article className="relative rounded-2xl border border-indigo-200 bg-primary/10 p-6 shadow-panel"><button type="button" onClick={() => setSelectedSession(null)} className="absolute right-4 top-4 rounded-lg p-1 text-indigo-500 hover:bg-primary-container/20" aria-label="Close session details"><X size={17} /></button><p className="text-xs font-semibold uppercase tracking-wider text-primary">Booked session details</p><h2 className="mt-1 text-xl font-bold text-on-surface">{selectedSession.subject} · {selectedSession.topic || 'Doubt session'}</h2><div className="mt-4 grid gap-3 text-sm text-on-surface sm:grid-cols-2"><p><strong>Student:</strong> {selectedSession.student?.name || 'Student'}</p><p><strong>Status:</strong> <span className="capitalize">{selectedSession.status}</span></p><p><strong>When:</strong> {new Date(selectedSession.scheduled_at).toLocaleString()}</p><p><strong>Duration:</strong> {selectedSession.duration_minutes} minutes</p></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-on-surface">{selectedSession.description}</p>{selectedSession.meeting_link && <a href={selectedSession.meeting_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-semibold text-white hover:bg-inverse-primary"><ExternalLink size={16} /> Open meeting</a>}</article>}
      <div className="flex items-center gap-4"><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2.5 text-sm font-semibold text-white hover:bg-inverse-primary disabled:opacity-60"><Save size={16} />{saving ? 'Saving...' : 'Save availability'}</button>{message && <p className="text-sm text-on-surface-variant">{message}</p>}</div>
    </section>
  );
}
