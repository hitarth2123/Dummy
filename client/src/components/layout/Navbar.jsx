import React from 'react';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';

const roleLabels = {
  student: 'Student workspace',
  faculty: 'Faculty workspace',
  hod: 'Department workspace',
  admin: 'Administration',
};

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'student';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={onMenuClick}
          >
            <Menu size={21} />
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 text-white">
              <ShieldCheck size={19} />
            </span>
            <div>
              <p className="font-semibold tracking-tight text-ink">AI Buddy</p>
              <p className="hidden text-xs text-slate-500 sm:block">{roleLabels[role]}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{user?.name || 'Account'}</p>
            <p className="text-xs capitalize text-slate-500">{role}</p>
          </div>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
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