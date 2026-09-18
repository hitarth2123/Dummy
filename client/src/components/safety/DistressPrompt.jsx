import { CheckCircle2, ShieldAlert, X } from 'lucide-react';

export default function DistressPrompt({ detection, onConfirm, onDismiss, status = '' }) {
  if (!detection?.flagged && status !== 'help_on_the_way') return null;
  const confirmed = status === 'help_on_the_way';
  return <div className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/75 p-4" role="dialog" aria-modal="true">
    <div className="w-full max-w-md rounded-2xl border border-rose-300/30 bg-slate-900 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><ShieldAlert className="text-rose-300" /><h2 className="text-xl font-bold text-white">Do you need help?</h2></div>{!confirmed && <button onClick={onDismiss} aria-label="Close"><X className="text-slate-400" /></button>}</div>
      {confirmed ? <div className="mt-5 flex gap-3 rounded-xl bg-emerald-500/15 p-4 text-emerald-100"><CheckCircle2 className="shrink-0" /><p><strong>Help is on the way.</strong><br />A campus support contact has been notified.</p></div> : <><p className="mt-4 text-sm leading-6 text-slate-300">We noticed language that may indicate you are under significant distress. You can contact campus support now.</p><div className="mt-6 flex gap-3"><button onClick={onConfirm} className="flex-1 rounded-lg bg-rose-500 px-4 py-3 font-semibold text-white">Yes, get help</button><button onClick={onDismiss} className="flex-1 rounded-lg border border-white/15 px-4 py-3 text-slate-200">No, continue</button></div></>}
    </div>
  </div>;
}