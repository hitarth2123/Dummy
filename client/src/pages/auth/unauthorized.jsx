import React from 'react';
import { ArrowLeft, Home, ShieldX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dashboard = user?.role ? `/${user.role}/dashboard` : '/login';

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-panel sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600"><ShieldX size={31} /></div>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Access restricted</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">This page is not in your workspace</h1>
        <p className="mt-4 text-slate-600">Your account does not have permission to view this route. Contact IT if you believe this is a mistake.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={17} /> Go back</button>
          <Link to={dashboard} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"><Home size={17} /> Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
};

export default Unauthorized;