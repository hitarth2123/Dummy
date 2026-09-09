import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, CalendarDays, ClipboardList, FileText, Gauge, GraduationCap, HelpCircle, MessageSquare, Settings, ShieldAlert, Users, X } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';

const navigation = {
  student: [
    ['Dashboard', '/student', Gauge],
    ['Mock test', '/student/mock-test', FileText],
    ['Learning path', '/student/learning-path', BookOpen],
    ['Question bank', '/student/question-bank', ClipboardList],
    ['Practice MCQ', '/student/practice-mcq', HelpCircle],
    ['AI tutor', '/student/ai-tutor', MessageSquare],
    ['Sessions', '/student/my-sessions', CalendarDays],
    ['Forum', '/student/forum', MessageSquare],
  ],
  faculty: [
    ['Dashboard', '/faculty', Gauge], ['Availability', '/faculty/availability', CalendarDays],
    ['Session requests', '/faculty/session-requests', ClipboardList], ['My sessions', '/faculty/my-sessions', BookOpen],
  ],
  hod: [
    ['Dashboard', '/hod', Gauge], ['Audit log', '/hod/audit-log', FileText],
    ['Ethics config', '/hod/ethics-config', ShieldAlert], ['Faculty', '/hod/faculty', Users],
  ],
  admin: [
    ['Dashboard', '/admin', Gauge], ['Users', '/admin/users', Users], ['Timetable', '/admin/timetable', CalendarDays],
    ['Emergency contacts', '/admin/emergency-contacts', ShieldAlert], ['Feedback', '/admin/feedback', FileText],
  ],
};

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const items = navigation[user?.role] || navigation.student;

  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-7 flex items-center justify-between px-2 lg:hidden">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Navigation</span>
          <button type="button" aria-label="Close navigation" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mb-5 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Your workspace</p>
          <p className="mt-1 text-sm text-slate-500">{user?.department || user?.dept || 'Institutional portal'}</p>
        </div>
        <nav className="space-y-1" aria-label="Primary navigation">
          {items.map(([label, href, Icon]) => (
            <NavLink key={href} to={href} end={href.split('/').length === 2} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'}`}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-100 pt-4">
          <NavLink to="/unauthorized" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-ink"><Settings size={18} />Help & access</NavLink>
          <div className="mt-4 flex items-center gap-2 px-3 text-xs text-slate-400"><GraduationCap size={16} /> Institutional learning system</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;