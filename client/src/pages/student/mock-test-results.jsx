import React from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const MockTestResults = () => {
  const result = JSON.parse(localStorage.getItem('ai_buddy_mock_result') || '{}');
  const score = result.score_pct || 0;
  const download = () => { const text = `AI Buddy Mock Test\nScore: ${score}%\n\n${(result.topic_breakdown || []).map((item) => `${item.topic}: ${item.score_pct}%`).join('\n')}`; const blob = new Blob([text], { type: 'application/pdf' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mock-test-results.pdf'; anchor.click(); URL.revokeObjectURL(url); };
  return <section className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Assessment complete</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Mock test results</h1></div><div className="grid gap-5 md:grid-cols-[220px_1fr]"><div className="grid place-items-center rounded-2xl bg-white p-6 shadow-panel"><div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#0f766e ${score}%, #e2e8f0 0)` }}><div className="grid h-28 w-28 place-items-center rounded-full bg-white"><span className="text-3xl font-semibold">{score}%</span></div></div></div><div className="rounded-2xl bg-white p-6 shadow-panel"><h2 className="text-xl font-semibold">Topic breakdown</h2><div className="mt-5 space-y-4">{(result.topic_breakdown || []).map((item) => <div key={item.topic}><div className="flex justify-between text-sm"><span>{item.topic}</span><span>{item.score_pct}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${item.score_pct < 60 ? 'bg-amber-500' : 'bg-teal-700'}`} style={{ width: `${item.score_pct}%` }} /></div></div>)}</div></div></div><div className="flex flex-wrap gap-3"><button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><Download size={17} /> Download results</button><Link to="/student/practice-mcq" className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white">Practice weak topics <ArrowRight size={17} /></Link></div></section>;
};

export default MockTestResults;
