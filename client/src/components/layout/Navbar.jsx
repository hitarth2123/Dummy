import React from 'react';
import { LogOut, Menu, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';

const roleLabels = {
  student: 'Student Workspace',
  faculty: 'Faculty Workspace',
  hod: 'Department Oversight',
  admin: 'Administration Portal',
};

const Navbar = ({ onMenuClick, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'student';

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
          <div className="hidden lg:flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-[11px] font-code-md text-secondary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-container"></span>
            </span>
            <span>System Active</span>
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