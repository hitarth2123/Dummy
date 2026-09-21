import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, LoaderCircle, Send, ShieldAlert, Sparkles, FileText, Info } from 'lucide-react';
import { feedbackService } from '@services/api.service';

const categories = [
  { id: 'ai_hallucination', label: 'AI Hallucination / Inaccurate Fact', desc: 'The AI generated factually incorrect information or wrong equations.' },
  { id: 'out_of_syllabus', label: 'Out of Syllabus Content', desc: 'Content provided does not align with your institutional course curriculum.' },
  { id: 'wrong_answer_key', label: 'Incorrect MCQ / Practice Answer', desc: 'The marked correct option in a practice question or mock test is wrong.' },
  { id: 'technical_bug', label: 'Technical Bug / UI Issue', desc: 'Page error, loading failure, or broken interface component.' },
  { id: 'other', label: 'General Feedback or Suggestion', desc: 'Feature requests or general platform improvements.' },
];

const reportLevels = [
  { id: 'low', label: 'Low', color: 'border-slate-700 bg-slate-800 text-outline' },
  { id: 'medium', label: 'Medium', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  { id: 'high', label: 'High', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
];

export default function ReportHallucination() {
  const [formData, setFormData] = useState({
    category: 'ai_hallucination',
    subject: 'Artificial Intelligence',
    prompt_used: '',
    ai_response: '',
    explanation: '',
    severity: 'medium',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.explanation.trim()) {
      setError('Please provide a brief explanation of the issue.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        category: formData.category,
        subject: formData.subject,
        comments: `[Severity: ${formData.severity.toUpperCase()}]\nPrompt: ${formData.prompt_used}\nAI Output: ${formData.ai_response}\n\nExplanation: ${formData.explanation}`,
        ratings: { overall: 2 },
      };

      await feedbackService.submit(payload);
      setSuccess(true);
      setSubmittedIssue({ ...formData, timestamp: new Date().toISOString() });
      setFormData({
        category: 'ai_hallucination',
        subject: 'Artificial Intelligence',
        prompt_used: '',
        ai_response: '',
        explanation: '',
        severity: 'medium',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit issue report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-surface-container-low via-slate-900/90 to-surface-container p-6 text-on-surface shadow-panel sm:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-glow">
            <ShieldAlert size={24} />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/30">
              <Sparkles size={12} className="text-secondary" />
              <span className="text-primary-fixed font-bold">Safety & Quality Hub</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Report <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-indigo-200">AI Response or Issue</span>
            </h1>
          </div>
        </div>
        <p className="relative z-10 mt-3 max-w-2xl text-sm font-medium text-on-surface-variant">
          Report inaccuracies, hallucinations, or out-of-syllabus responses so our engineering team and faculty oversight can review and correct them.
        </p>
      </section>

      {/* Success Notification */}
      {success && submittedIssue && (
        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-on-surface shadow-panel">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-lg text-emerald-300">Issue Report Submitted Successfully</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Thank you! Your ticket has been logged and forwarded to Department Oversight for review.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-xs font-bold text-outline">
                <span>Category: {categories.find(c => c.id === submittedIssue.category)?.label}</span>
                <span>•</span>
                <span>Subject: {submittedIssue.subject}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Report Form Card */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-surface-variant/40 bg-surface-container-low p-6 shadow-panel space-y-6 sm:p-8">
        <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2 border-b border-surface-variant/20 pb-4">
          <FileText size={20} className="text-primary" />
          <span>Issue Details Form</span>
        </h2>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-error-container/15 border border-error/20 p-4 text-sm text-error">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Category Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-3">
            1. Select Issue Category <span className="text-error">*</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.id })}
                className={`flex flex-col text-left rounded-2xl border p-4 transition ${
                  formData.category === cat.id
                    ? 'border-primary bg-primary-container/15 shadow-glow'
                    : 'border-surface-variant/40 bg-surface-container hover:border-primary/40'
                }`}
              >
                <span className={`font-bold text-sm ${formData.category === cat.id ? 'text-primary' : 'text-on-surface'}`}>
                  {cat.label}
                </span>
                <span className="text-xs text-on-surface-variant mt-1 leading-snug">{cat.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Subject & Severity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">
              2. Subject / Course <span className="text-error">*</span>
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full appearance-none rounded-xl border border-surface-variant/40 bg-surface-container px-4 py-3 text-sm font-semibold text-on-surface outline-none focus:border-primary cursor-pointer"
            >
              <option value="Artificial Intelligence" className="bg-slate-900 text-white">Artificial Intelligence</option>
              <option value="Database Management (DBMS)" className="bg-slate-900 text-white">Database Management (DBMS)</option>
              <option value="Compiler Design" className="bg-slate-900 text-white">Compiler Design</option>
              <option value="Cloud Computing" className="bg-slate-900 text-white">Cloud Computing</option>
              <option value="Distributed Systems" className="bg-slate-900 text-white">Distributed Systems</option>
              <option value="Computer Graphics" className="bg-slate-900 text-white">Computer Graphics</option>
              <option value="Software Engineering" className="bg-slate-900 text-white">Software Engineering</option>
              <option value="Other / General" className="bg-slate-900 text-white">Other / General Platform</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">
              Severity Level
            </label>
            <div className="flex gap-2">
              {reportLevels.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity: lvl.id })}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-bold capitalize transition ${
                    formData.severity === lvl.id
                      ? `${lvl.color} ring-1 ring-primary`
                      : 'border-surface-variant/40 bg-surface-container text-outline hover:border-primary/40'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Prompt / Question Asked */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">
            3. Prompt or Question Asked (Optional)
          </label>
          <input
            type="text"
            value={formData.prompt_used}
            onChange={(e) => setFormData({ ...formData, prompt_used: e.target.value })}
            placeholder="e.g. Explain Alpha-Beta Pruning in AI"
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary"
          />
        </div>

        {/* 4. AI Generated Response */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">
            4. Incorrect AI Response (Optional)
          </label>
          <textarea
            rows={2}
            value={formData.ai_response}
            onChange={(e) => setFormData({ ...formData, ai_response: e.target.value })}
            placeholder="Paste the output or question generated by the AI..."
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary resize-y"
          />
        </div>

        {/* 5. Detailed Explanation */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">
            5. Detailed Explanation & Correct Info <span className="text-error">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            placeholder="Explain why this response is incorrect or what the correct answer should be according to your textbook..."
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary resize-y"
          />
        </div>

        {/* Info Note */}
        <div className="flex items-center gap-2 rounded-xl bg-surface-container p-3.5 text-xs text-on-surface-variant">
          <Info size={16} className="text-primary shrink-0" />
          <span>Submissions are monitored by faculty and used to fine-tune the RAG knowledge embeddings.</span>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-slate-950 hover:bg-primary-fixed disabled:opacity-60 transition shadow-md"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                <span>Submitting Report...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Issue Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
