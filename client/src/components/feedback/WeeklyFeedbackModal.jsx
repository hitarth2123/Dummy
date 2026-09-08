import React, { useState } from 'react';
import { X } from 'lucide-react';
import { feedbackService } from '@services/api.service';

const categories = ['teaching_quality', 'content_clarity', 'ai_helpfulness', 'platform_usability', 'overall'];

const WeeklyFeedbackModal = ({ onClose }) => {
  const [ratings, setRatings] = useState(Object.fromEntries(categories.map((category) => [category, 5])));
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState('');
  const submit = async (event) => { event.preventDefault(); try { await feedbackService.submit({ ratings: categories.map((category) => ({ category, score: Number(ratings[category]) })), comments }); setStatus('Thanks for your feedback.'); setTimeout(onClose, 800); } catch (error) { setStatus(error.response?.data?.message || 'Feedback could not be submitted.'); } };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-panel"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Weekly check-in</p><h2 className="mt-1 text-xl font-semibold text-ink">How is your learning going?</h2></div><button type="button" aria-label="Close feedback" onClick={onClose}><X size={19} /></button></div><div className="mt-5 space-y-3">{categories.map((category) => <label key={category} className="flex items-center justify-between gap-4 text-sm capitalize text-slate-600">{category.replaceAll('_', ' ')}<select value={ratings[category]} onChange={(event) => setRatings({ ...ratings, [category]: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>)}</div><textarea value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Optional comments" className="mt-4 min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm" />{status && <p className="mt-3 text-sm text-teal-700">{status}</p>}<button className="mt-4 w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white">Submit feedback</button><p className="mt-3 text-center text-xs text-slate-400">You may contact IT support to unsubscribe from reminders.</p></form></div>;
};

export default WeeklyFeedbackModal;
