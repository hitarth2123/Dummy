import { PhoneCall, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import ContactCard from './ContactCard';
import { safetyService } from '@services/api.service';

export default function EmergencyPanel() {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  useEffect(() => { if (open) safetyService.getEmergencyContacts().then((result) => setContacts(result.data?.contacts || [])).catch(() => setContacts([])); }, [open]);
  return <><button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[9999] inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-3 font-bold text-white shadow-2xl" aria-label="Open emergency support"><PhoneCall size={18} />Emergency help</button>{open && <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-950/95 p-4 sm:p-8"><div className="mx-auto max-w-2xl"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><ShieldAlert className="text-rose-300" /><h2 className="text-2xl font-bold text-white">Emergency support</h2></div><button onClick={() => setOpen(false)} className="rounded-md border border-white/15 px-3 py-2 text-sm text-slate-200">Close</button></div><p className="mt-3 text-sm text-slate-300">For immediate danger, call 112. These contacts remain available during lockout and expired sessions.</p><div className="mt-6 grid gap-3">{contacts.map((contact, index) => <ContactCard key={`${contact.type}-${contact.phone}-${index}`} contact={contact} />)}</div></div></div>}</>;
}