import React from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, PanelLeftClose, PanelLeftOpen, Save, Settings2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { aiAvailabilityService, safetyService } from '@services/api.service';
import { useEffect, useState } from 'react';

const roleLabels = {
  student: 'Student Workspace',
  faculty: 'Faculty Workspace',
  hod: 'Department Oversight',
  admin: 'Administration Portal',
};

const Navbar = ({ onMenuClick, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'student';
  const canControl = ['admin', 'hod'].includes(role);
  const [availability, setAvailability] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  useEffect(() => { aiAvailabilityService.get().then((response) => setAvailability(response.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!['admin', 'hod', 'faculty'].includes(role)) return undefined;
    const loadAlerts = () => safetyService.getAlerts().then((response) => setAlerts(response.data || [])).catch(() => {});
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [role]);
  const saveAvailability = async (next) => {
    setSaving(true);
    try { const response = await aiAvailabilityService.update(next); setAvailability(response.data); } finally { setSaving(false); }
  };
  const isActive = availability?.ai_enabled !== false;

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.18)]">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Mobile Menu + Desktop Sidebar Collapse Toggle + Brand */}
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            type="button"
            aria-label="Open navigation"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors lg:hidden"
            onClick={onMenuClick}
          >
            <Menu size={21} />
          </button>

          {/* Desktop collapse toggle trigger */}
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden rounded-xl p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors lg:flex items-center justify-center border border-surface-variant/30"
            onClick={onToggleCollapse}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>

          <div className="flex items-center gap-space-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-container text-on-primary-container shadow-glow">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </span>
            <div>
              <p className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight leading-tight">AI Buddy</p>
              <p className="hidden text-[10px] text-on-surface-variant sm:block font-code-md">{roleLabels[role]}</p>
            </div>
          </div>
          <span className="hidden xl:inline-block px-space-sm py-0.5 rounded-full bg-surface-container-high text-secondary font-label-caps text-label-caps">
            {user?.department || 'Institutional'}
          </span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative flex items-center w-full bg-surface-container-low rounded-xl px-space-md py-1.5 shadow-[0_0_16px_rgba(148,125,255,0.08)]">
            <Search size={16} className="text-outline mr-space-sm" />
            <input
              className="w-full bg-transparent border-none outline-none font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:ring-0"
              placeholder="Search curriculum, topics, exams... (⌘K)"
              type="text"
            />
            <span className="font-code-md text-code-md px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[11px]">⌘K</span>
          </div>
        </div>

        {/* Right: Status + Profile + Logout */}
        <div className="flex items-center gap-3">
          {['admin', 'hod', 'faculty'].includes(role) && <div className="relative"><button type="button" onClick={() => setAlertsOpen((current) => !current)} aria-label={`Open safety alerts${alerts.length ? `, ${alerts.length} alerts` : ''}`} className={`relative rounded-lg p-2 transition-colors ${alerts.length ? 'text-rose-200 hover:bg-rose-300/15' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}><Bell size={19} />{alerts.length > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{alerts.length > 99 ? '99+' : alerts.length}</span>}</button>{alertsOpen && <div className="absolute right-0 top-11 z-50 w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-rose-300/25 bg-slate-950 p-4 text-left shadow-panel"><div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldAlert size={16} className="text-rose-300" />Student wellbeing alerts</h2><span className="text-xs text-slate-500">Live</span></div>{alerts.length === 0 ? <p className="mt-4 text-sm text-slate-500">No active alerts.</p> : <div className="mt-3 max-h-[28rem] space-y-3 overflow-y-auto">{alerts.map((alert) => { const profile = alert.metadata?.student_profile || alert.actor || {}; return <article key={alert._id} className="rounded-md border border-rose-300/20 bg-rose-950/25 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">{profile.name || 'Student'} <span className="font-normal text-slate-400">· {profile.department || alert.department || 'Unknown department'}</span></p><p className="mt-0.5 text-xs text-slate-500">{profile.email || 'No email'} · {new Date(alert.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-rose-400/15 px-2 py-1 text-[10px] font-bold uppercase text-rose-200">Critical</span></div><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-rose-200">Student wrote</p><p className="mt-1 text-sm leading-5 text-slate-200">{alert.metadata?.student_message || alert.metadata?.prompt || 'Message unavailable'}</p><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">AI answered</p><p className="mt-1 text-sm leading-5 text-slate-300">{alert.metadata?.ai_response || 'Response unavailable'}</p></article>; })}</div>}</div>}</div>}
          <div className="relative hidden lg:block">
          <button type="button" onClick={() => canControl && setOpen((current) => !current)} className={`flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-[11px] font-code-md ${isActive ? 'text-secondary' : 'text-amber-200'} ${canControl ? 'cursor-pointer hover:bg-surface-container-high' : 'cursor-default'}`} aria-haspopup={canControl ? 'menu' : undefined}>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'animate-ping bg-secondary-container' : 'bg-amber-300'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-secondary-container' : 'bg-amber-300'}`}></span>
            </span>
            <span>{isActive ? 'System Active' : 'AI Paused'}</span>{canControl && <ChevronDown size={13} />}
          </button>
          {canControl && open && availability && <div className="absolute right-0 top-9 z-50 w-80 rounded-lg border border-white/15 bg-slate-950 p-4 text-left shadow-panel"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold text-white"><Settings2 size={15} /> AI controls</p><span className="text-xs text-slate-500">{saving ? 'Saving...' : 'Admin/HOD'}</span></div><label className="mt-4 flex items-center justify-between gap-3 rounded-md bg-white/5 p-3 text-sm text-slate-200"><span>All AI features</span><input type="checkbox" checked={availability.ai_enabled !== false} onChange={(event) => saveAvailability({ ai_enabled: event.target.checked })} /></label><label className="mt-3 block text-xs text-slate-400">Resume all features at<input type="datetime-local" value={availability.ai_resume_at ? new Date(availability.ai_resume_at).toISOString().slice(0, 16) : ''} onChange={(event) => saveAvailability({ ai_resume_at: event.target.value ? new Date(event.target.value).toISOString() : null })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-white" /></label><div className="mt-3 max-h-56 space-y-2 overflow-y-auto">{Object.entries(availability.features || {}).map(([key, feature]) => <label key={key} className="flex items-center justify-between gap-3 px-1 text-xs capitalize text-slate-300"><span>{key.replaceAll('_', ' ')}</span><input type="checkbox" checked={feature.enabled !== false} onChange={(event) => saveAvailability({ features: { [key]: { enabled: event.target.checked, resume_at: feature.resume_at, message: feature.message } } })} /></label>)}</div><button type="button" onClick={() => saveAvailability({ ai_enabled: true, ai_resume_at: null })} className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-300"><Save size={13} /> Restore all</button></div>}
          </div>

          <div className="hidden sm:flex text-right flex-col">
            <p className="text-label-interactive font-label-interactive text-on-surface leading-tight">{user?.name || 'Account'}</p>
            <p className="text-[10px] capitalize text-outline leading-tight">{role}</p>
          </div>

          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
            onClick={logout}
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;