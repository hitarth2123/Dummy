import { ExternalLink, MapPin, Phone } from 'lucide-react';

export default function ContactCard({ contact }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${contact.name} ${contact.address || ''}`)}`;
  return (
    <article className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs uppercase tracking-wider text-slate-400">{contact.type}</p><h3 className="mt-1 font-semibold text-white">{contact.name}</h3><p className="mt-1 text-sm text-slate-400">{contact.address || contact.notes || 'Emergency support contact'}</p></div>
        <Phone className="text-rose-300" size={18} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {contact.phone && <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 rounded-md bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-100"><Phone size={15} />Call {contact.phone}</a>}
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm text-slate-200"><MapPin size={15} />Directions <ExternalLink size={13} /></a>
      </div>
    </article>
  );
}