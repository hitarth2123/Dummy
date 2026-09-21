import React from 'react';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlaceholderPage = ({ title, description, subtitle = "AI Buddy Institutional Portal" }) => (
  <div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
      {/* Decorative background glow */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 shadow-sm">
          <Sparkles size={14} className="text-secondary" />
          <span className="text-primary-fixed">{subtitle}</span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">{title}</span>
        </h1>
        <p className="mt-2 text-on-surface-variant font-medium text-sm sm:text-base">
          {description || "Access institutional AI-driven tools, curriculum insights, and automated academic management."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/student"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-primary-fixed hover:shadow-glow shadow-md"
          >
            <Layers size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-container/15 text-primary">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-on-surface">Active Workflow Ready</h3>
          <p className="text-xs text-on-surface-variant">Connected with RAG knowledge engine & role access policies.</p>
        </div>
      </div>
    </section>
  </div>
);

export default PlaceholderPage;