import { useEffect, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Save, Search, Settings2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { aiAvailabilityService, safetyService } from '@services/api.service';

const roleLabels = { student: 'Student Workspace', faculty: 'Faculty Workspace', hod: 'Department Oversight', admin: 'Administration Portal' };

function AlertPanel({ alerts, unseenAlerts }) {
  if (!alerts.length) return <p className="mt-4 text-sm text-slate-500">No active alerts.</p>;
  return <div className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto">{alerts.map((alert) => {
    const profile = alert.metadata?.student_profile || alert.actor || {};
    const unread = unseenAlerts.some((item) => String(item._id) === String(alert._id));
    return <article key={alert._id} className={`rounded-md border p-3 ${unread ? 'border-rose-300/30 bg-rose-950/35' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">{profile.name || 'Student'} <span className="font-normal text-slate-400">· {profile.department || alert.department || 'Unknown department'}</span></p><p className="mt-0.5 text-xs text-slate-500">{profile.email || 'No email'} · {new Date(alert.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-rose-400/15 px-2 py-1 text-[10px] font-bold uppercase text-rose-200">Critical</span></div>
      <p className="mt-3 text-xs leading-5 text-slate-300">{alert.metadata?.student_message || 'A distress signal was confirmed and escalated.'}</p>
    </article>;
  })}</div>;
}

export default function Navbar({ onMenuClick, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'student';
  const canControl = ['admin', 'hod'].includes(role);
  const [availability, setAvailability] = useState(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [seenAlertIds, setSeenAlertIds] = useState(() => { try { return JSON.parse(localStorage.getItem('ai_buddy_seen_alerts') || '[]'); } catch { return []; } });
  const unseenAlerts = alerts.filter((alert) => !seenAlertIds.includes(String(alert._id)));

  useEffect(() => { aiAvailabilityService.get().then((response) => setAvailability(response.data)).catch(() => {}); }, []);
  useEffect(() => { if (!['admin', 'hod', 'faculty'].includes(role)) return undefined; const load = () => safetyService.getAlerts().then((response) => setAlerts(response.data || [])).catch(() => {}); load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [role]);
  const toggleAlerts = () => { if (!alertsOpen && alerts.length) { const next = [...new Set([...seenAlertIds, ...alerts.map((alert) => String(alert._id))])]; setSeenAlertIds(next); localStorage.setItem('ai_buddy_seen_alerts', JSON.stringify(next)); } setAlertsOpen((current) => !current); };
  const saveAvailability = async (next) => { setSaving(true); try { const response = await aiAvailabilityService.update(next); setAvailability(response.data); } finally { setSaving(false); } };
  const isActive = availability?.ai_enabled !== false;
  const notificationButton = ['admin', 'hod', 'faculty'].includes(role) ? <div className="relative"><button type="button" onClick={toggleAlerts} aria-label={`Open safety alerts${unseenAlerts.length ? `, ${unseenAlerts.length} unread` : ''}`} className={`relative rounded-lg p-2 ${unseenAlerts.length ? 'text-rose-200 hover:bg-rose-300/15' : 'text-on-surface-variant hover:bg-surface-container'}`}><Bell size={19} />{unseenAlerts.length > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{unseenAlerts.length > 99 ? '99+' : unseenAlerts.length}</span>}</button>{alertsOpen && <div className="absolute right-0 top-11 z-50 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-rose-300/25 bg-slate-950 p-4 text-left shadow-panel"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldAlert size={16} className="text-rose-300" />Student wellbeing alerts</h2><span className="text-xs text-slate-500">{unseenAlerts.length ? `${unseenAlerts.length} unread` : 'All seen'}</span></div><AlertPanel alerts={alerts} unseenAlerts={unseenAlerts} /></div>}</div> : null;

  return <header className="sticky top-0 z-30 h-16 bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.18)] backdrop-blur-xl"><div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6"><div className="flex items-center gap-3"><button type="button" aria-label="Open navigation" className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container lg:hidden" onClick={onMenuClick}><Menu size={21} /></button><button type="button" aria-label="Toggle sidebar" className="hidden rounded-xl border border-surface-variant/30 p-2 text-on-surface-variant hover:bg-surface-container lg:flex" onClick={onToggleCollapse}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-container text-on-primary-container">✦</span><div><p className="font-bold leading-tight text-primary">AI Buddy</p><p className="hidden text-[10px] text-on-surface-variant sm:block">{roleLabels[role]}</p></div></div><span className="hidden rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] text-secondary xl:inline-block">{user?.department || 'Institutional'}</span></div><div className="mx-4 hidden max-w-xl flex-1 items-center rounded-xl bg-surface-container-low px-4 py-1.5 md:flex"><Search size={16} className="mr-2 text-outline" /><input className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline" placeholder="Search curriculum, topics, exams..." /></div><div className="flex items-center gap-3">
    {notificationButton}
    <div className="relative hidden lg:block"><button type="button" onClick={() => canControl && setControlsOpen((current) => !current)} className={`flex items-center gap-2 rounded-full bg-surface-container px-2 py-1 text-[11px] ${isActive ? 'text-secondary' : 'text-amber-200'}`}><span className={`h-2 w-2 rounded-full ${isActive ? 'bg-secondary-container' : 'bg-amber-300'}`} />{isActive ? 'System Active' : 'AI Paused'}{canControl && <ChevronDown size={13} />}</button>{canControl && controlsOpen && availability && <div className="absolute right-0 top-9 z-50 w-80 rounded-lg border border-white/15 bg-slate-950 p-4 shadow-panel"><p className="flex items-center gap-2 text-sm font-semibold text-white"><Settings2 size={15} />AI controls</p><label className="mt-4 flex items-center justify-between rounded-md bg-white/5 p-3 text-sm text-slate-200">All AI features<input type="checkbox" checked={availability.ai_enabled !== false} onChange={(event) => saveAvailability({ ai_enabled: event.target.checked })} /></label><span className="mt-3 block text-xs text-slate-500">{saving ? 'Saving...' : 'Changes apply across the workspace.'}</span><button type="button" onClick={() => saveAvailability({ ai_enabled: true, ai_resume_at: null })} className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-300"><Save size={13} />Restore all</button></div>}</div>
    <div className="hidden text-right sm:block"><p className="text-sm font-semibold leading-tight text-on-surface">{user?.name || 'Account'}</p><p className="text-[10px] capitalize text-outline">{role}</p></div><button type="button" title="Sign out" aria-label="Sign out" className="rounded-lg p-2 text-on-surface-variant hover:bg-error-container" onClick={logout}><LogOut size={19} /></button>
  </div></div></header>;
}
