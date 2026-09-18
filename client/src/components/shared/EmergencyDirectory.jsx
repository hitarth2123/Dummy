import { ExternalLink, Mail, MapPin, Phone, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { safetyService } from '@services/api.service';

const contacts = [
  {
    group: 'Immediate response',
    tone: 'rose',
    entries: [
      { label: 'Unified emergency number', name: 'National Emergency Response', phone: '112', note: 'Police, fire, ambulance, and urgent campus incidents.' },
      { label: 'Police', name: 'Police control room', phone: '100', note: 'Crime, immediate danger, or security assistance.' },
      { label: 'Fire and rescue', name: 'Fire station', phone: '101', note: 'Fire, smoke, gas leak, or rescue emergency.' },
      { label: 'Ambulance', name: 'Emergency medical service', phone: '108', note: 'Medical emergency or hospital transfer.' },
    ],
  },
  {
    group: 'Specialist support',
    tone: 'amber',
    entries: [
      { label: 'Women’s helpline', name: 'Women in distress support', phone: '181', note: 'Women’s safety, violence, and crisis support.' },
      { label: 'Child helpline', name: 'Child emergency support', phone: '1098', note: 'For anyone reporting a child safety concern.' },
      { label: 'Cybercrime helpline', name: 'National Cyber Crime Reporting', phone: '1930', note: 'Online fraud, cybercrime, or digital harassment.' },
      { label: 'Mental health support', name: 'Tele-MANAS', phone: '14416', note: '24/7 mental-health support and crisis guidance.' },
    ],
  },
  {
    group: 'Campus and education',
    tone: 'cyan',
    entries: [
      { label: 'Nearest hospital', name: 'Configure campus hospital', phone: '', note: 'Add the verified hospital name and local number in the admin directory.' },
      { label: 'Nearest police station', name: 'Configure local police station', phone: '', note: 'Add the station name and direct number for this campus.' },
      { label: 'Nearest fire station', name: 'Configure local fire station', phone: '', note: 'Add the station name and direct number for this campus.' },
      { label: 'Education department', name: 'Institution education office', email: 'education.department@institution.edu', note: 'Replace this placeholder with the verified department email.' },
    ],
  },
];

const toneStyles = {
  rose: { border: 'border-rose-300/25', icon: 'bg-rose-400/15 text-rose-200', badge: 'bg-rose-400/10 text-rose-200' },
  amber: { border: 'border-amber-300/25', icon: 'bg-amber-400/15 text-amber-200', badge: 'bg-amber-400/10 text-amber-200' },
  cyan: { border: 'border-cyan-300/25', icon: 'bg-cyan-400/15 text-cyan-200', badge: 'bg-cyan-400/10 text-cyan-200' },
};

const ContactAction = ({ entry }) => {
  if (entry.phone) return <a href={`tel:${entry.phone}`} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"><Phone size={15} />{entry.phone}</a>;
  if (entry.email) return <a href={`mailto:${entry.email}`} className="inline-flex max-w-full shrink-0 items-center gap-2 break-all rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"><Mail size={15} />Email office</a>;
  return <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-dashed border-white/20 px-3 py-2 text-xs text-slate-400"><MapPin size={14} />Needs local setup</span>;
};

export default function EmergencyDirectory({ admin = false }) {
  const [remoteContacts, setRemoteContacts] = useState([]);
  useEffect(() => { if (!admin) safetyService.getEmergencyContacts().then((result) => setRemoteContacts(result.data?.contacts || [])).catch(() => setRemoteContacts([])); }, [admin]);
  const displayedContacts = remoteContacts.length ? [{ group: 'Verified emergency contacts', tone: 'rose', entries: remoteContacts.map((entry) => ({ label: entry.type, name: entry.name, phone: entry.phone, note: entry.address || entry.notes })) }] : contacts;
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-lg border border-rose-300/25 bg-gradient-to-br from-rose-950/70 via-slate-950/80 to-cyan-950/50 p-6 shadow-panel sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-200"><ShieldAlert size={14} /> Emergency support</div>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Help when every second matters.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Call the right service directly. For immediate danger, call <strong className="text-white">112</strong> first and share your campus name, building, floor, and nearest landmark.</p>
        </div>
      </header>

      {!admin && <div className="rounded-md border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">These are India-wide emergency numbers. Campus-specific hospital, police station, fire station, and education office details must be verified with your institution.</div>}
      {admin && <div className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-100">Admin setup note: replace the three local placeholders and the education office email with verified campus contacts before release.</div>}

      <div className="grid gap-5 xl:grid-cols-3">
        {displayedContacts.map((section) => {
          const styles = toneStyles[section.tone];
          return <section key={section.group} className={`rounded-lg border ${styles.border} bg-slate-950/55 p-5 shadow-panel`}><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">{section.group}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${styles.badge}`}>{section.entries.length} contacts</span></div><div className="mt-4 space-y-3">{section.entries.map((entry) => <article key={entry.label} className="rounded-md border border-white/10 bg-white/[0.03] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{entry.label}</p><h3 className="mt-1 text-base font-semibold text-white">{entry.name}</h3><p className="mt-1 text-sm leading-5 text-slate-400">{entry.note}</p>{entry.email && <p className="mt-2 break-all text-xs text-cyan-200">{entry.email}</p>}</div><div className={styles.icon}><ContactAction entry={entry} /></div></div></article>)}</div></section>;
        })}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-500"><ExternalLink size={14} /> Verify local contacts with campus security and the district administration before publishing this directory.</footer>
    </div>
  );
}
