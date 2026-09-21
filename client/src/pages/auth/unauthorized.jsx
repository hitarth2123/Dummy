import React from 'react';
import { ArrowLeft, Home, ShieldX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dashboard = user?.role ? `/${user.role}/dashboard` : '/login';

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-surface-variant/40 bg-surface-container-low p-8 text-center shadow-panel sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-error-container/15 text-error"><ShieldX size={31} /></div>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-error">Access restricted</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-on-surface">This page is not in your workspace</h1>
        <p className="mt-4 text-on-surface-variant">Your account does not have permission to view this route. Contact IT if you believe this is a mistake.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-variant/40 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container"><ArrowLeft size={17} /> Go back</button>
          <Link to={dashboard} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 text-sm font-semibold text-white hover:bg-inverse-primary"><Home size={17} /> Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
};

export default Unauthorized;