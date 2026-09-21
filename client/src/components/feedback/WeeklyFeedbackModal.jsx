import React, { useState } from 'react';
import { X } from 'lucide-react';
import { feedbackService } from '@services/api.service';

const categories = ['teaching_quality', 'content_clarity', 'ai_helpfulness', 'platform_usability', 'overall'];

const WeeklyFeedbackModal = ({ onClose }) => {
  const [ratings, setRatings] = useState(Object.fromEntries(categories.map((c) => [c, 5])));
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      await feedbackService.submit({ ratings: categories.map((c) => ({ category: c, score: Number(ratings[c]) })), comments });
      setStatus('Thanks for your feedback.');
      setTimeout(onClose, 800);
    } catch (error) {
      setStatus(error.response?.data?.message || 'Feedback could not be submitted.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-surface-variant/30 p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-caps font-label-caps uppercase tracking-wider text-secondary">Weekly Check-in</p>
            <h2 className="mt-1 text-headline-sm font-headline-sm text-on-surface">How is your learning going?</h2>
          </div>
          <button type="button" aria-label="Close feedback" className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {categories.map((c) => (
            <label key={c} className="flex items-center justify-between gap-4 text-body-md font-body-md capitalize text-on-surface-variant">
              {c.replaceAll('_', ' ')}
              <select
                value={ratings[c]}
                onChange={(e) => setRatings({ ...ratings, [c]: e.target.value })}
                className="rounded-lg border border-surface-variant/50 bg-surface-container px-3 py-2 text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
          ))}
        </div>

        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Optional comments"
          className="mt-4 min-h-20 w-full rounded-lg border border-surface-variant/40 bg-surface-container p-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary/30"
        />

        {status && <p className="mt-3 text-body-sm text-secondary">{status}</p>}

        <button className="mt-4 w-full rounded-xl bg-primary-container px-4 py-3 text-label-interactive font-label-interactive font-semibold text-on-primary-container shadow-glow transition hover:opacity-90">
          Submit Feedback
        </button>

        <p className="mt-3 text-center text-[11px] text-outline">
          You may contact IT support to unsubscribe from reminders.
        </p>
      </form>
    </div>
  );
};

export default WeeklyFeedbackModal;
