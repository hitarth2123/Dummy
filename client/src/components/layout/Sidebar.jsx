import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity, BookOpen, CalendarDays, ChevronLeft, ChevronRight, ClipboardList,
  FileText, Gauge, GraduationCap, HelpCircle, MessageSquare, Settings,
  ShieldAlert, Users, X, Sparkles
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';

const navigation = {
  student: [
    { section: 'Academic Hub', items: [
      ['Dashboard', '/student', Gauge],
      ['AI Tutor', '/student/ai-tutor', Sparkles, 'RAG'],
      ['Mock Test', '/student/mock-test', FileText],
      ['Learning Path', '/student/learning-path', BookOpen],
      ['Question Bank', '/student/question-bank', ClipboardList],
      ['Practice MCQ', '/student/practice-mcq', HelpCircle],
    ]},
    { section: 'Support', items: [
      ['Book Session', '/student/book-session', CalendarDays],
      ['My Sessions', '/student/my-sessions', CalendarDays],
      ['Forum', '/student/forum', MessageSquare],
    ]},
    { section: 'Safety', items: [
      ['Report Issue', '/student/report-hallucination', ShieldAlert],
    ]},
  ],
  faculty: [
    { section: 'Faculty Portal', items: [
      ['Dashboard', '/faculty', Gauge],
      ['Availability', '/faculty/availability', CalendarDays],
      ['Session Requests', '/faculty/session-requests', ClipboardList],
      ['Profile Requests', '/faculty/profile-change-requests', ClipboardList],
      ['My Sessions', '/faculty/my-sessions', BookOpen],
    ]},
  ],
  hod: [
    { section: 'Department', items: [
      ['Dashboard', '/hod', Gauge],
      ['Audit Log', '/hod/audit-log', FileText],
      ['Ethics Config', '/hod/ethics-config', ShieldAlert],
      ['Faculty Mgmt', '/hod/faculty', Users],
    ]},
  ],
  admin: [
    { section: 'Administration', items: [
      ['Dashboard', '/admin', Gauge],
      ['Student Activity', '/admin/student-activity', Activity],
      ['Audit Log', '/admin/audit-log', FileText],
      ['Users', '/admin/users', Users],
      ['Timetable', '/admin/timetable', CalendarDays],
      ['Emergency Contacts', '/admin/emergency-contacts', ShieldAlert],
      ['Feedback', '/admin/feedback', FileText],
    ]},
  ],
};

const Sidebar = ({ open, collapsed, onClose, onToggleCollapse }) => {
  const { user } = useAuth();
  const sections = navigation[user?.role] || navigation.student;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sticky & Fixed Responsive Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col bg-surface-container-lowest/95 backdrop-blur-2xl transition-all duration-300 lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100vh-4rem)] border-r border-surface-variant/30 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-72 lg:w-20' : 'w-72 lg:w-64'}`}
      >
        {/* Header: Collapse Toggle & Workspace Name */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-surface-variant/20">
          {!collapsed && (
            <span className="hidden font-label-caps text-label-caps text-secondary uppercase tracking-wider lg:block">
              Navigation
            </span>
          )}
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden rounded-xl p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors lg:flex items-center justify-center border border-surface-variant/40"
            onClick={onToggleCollapse}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          
          <button
            type="button"
            aria-label="Close navigation"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container transition-colors lg:hidden"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace info */}
        {!collapsed ? (
          <div className="px-4 py-3 border-b border-surface-variant/15">
            <p className="font-label-caps text-[10px] text-secondary uppercase tracking-wider">Your Workspace</p>
            <p className="mt-0.5 text-xs font-bold text-on-surface truncate">{user?.department || user?.dept || 'Institutional Portal'}</p>
          </div>
        ) : (
          <div className="hidden lg:flex justify-center py-3 border-b border-surface-variant/15" title={user?.department || 'Portal'}>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-primary text-xs font-bold border border-primary/30">
              {user?.role?.slice(0, 1).toUpperCase() || 'S'}
            </span>
          </div>
        )}

        {/* Navigation items (Internal smooth scrollbar) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {sections.map((section) => (
            <div key={section.section} className="space-y-1">
              {!collapsed ? (
                <p className="px-3 text-[10px] font-extrabold text-outline uppercase tracking-wider">
                  {section.section}
                </p>
              ) : (
                <div className="hidden lg:block h-px bg-surface-variant/30 my-2" />
              )}
              <nav className="flex flex-col gap-1">
                {section.items.map(([label, href, Icon, badge]) => (
                  <NavLink
                    key={href}
                    to={href}
                    title={collapsed ? label : undefined}
                    end={href.split('/').length === 2}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl py-2.5 transition-all ${
                        collapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3 justify-between'
                      } ${
                        isActive
                          ? 'bg-primary text-slate-950 font-extrabold shadow-glow'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={19} strokeWidth={2} className="shrink-0" />
                      {!collapsed && <span className="text-sm truncate">{label}</span>}
                    </div>
                    {!collapsed && badge && (
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary text-[10px] font-bold uppercase shrink-0">
                        {badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom footer */}
        <div className="p-3 border-t border-surface-variant/30 space-y-2">
          <NavLink
            to={user?.role === 'student' ? '/student/settings' : '/unauthorized'}
            title={collapsed ? 'Settings' : undefined}
            className={`flex items-center gap-3 rounded-xl py-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors ${
              collapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'
            }`}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          {!collapsed && (
            <div className="mt-2 flex items-center gap-2 px-3 text-[11px] text-outline font-code-md">
              <GraduationCap size={15} />
              <span>AI Buddy v3 • Responsive</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;