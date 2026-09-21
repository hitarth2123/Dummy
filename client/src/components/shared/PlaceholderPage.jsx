import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const PlaceholderPage = ({ title }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:p-8">
    <div className="flex max-w-2xl items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><Sparkles size={20} /></span>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">AI Buddy workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-3 text-slate-600">This workspace is ready for your institutional content and workflows.</p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-slate-500">Preparing your next view <ArrowUpRight size={16} /></span>
      </div>
    </div>
  </section>
);

export default PlaceholderPage;