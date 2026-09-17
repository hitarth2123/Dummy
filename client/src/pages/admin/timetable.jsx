import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, FileUp, LoaderCircle, RefreshCw, UploadCloud } from 'lucide-react';
import { adminService } from '@services/api.service';

const emptyMetadata = { department: 'Computer Science', semester: '5', exam_type: 'internal' };

const previewCsv = (csv) => {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/).filter(Boolean);
  if (!headerLine) return { headers: [], rows: [] };
  const headers = headerLine.split(',').map((header) => header.trim());
  const rows = lines.slice(0, 5).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(',')[index]?.trim() || ''])));
  return { headers, rows };
};

export default function Timetable() {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [metadata, setMetadata] = useState(emptyMetadata);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadTimetable = () => {
    setLoading(true);
    adminService.getTimetable()
      .then((response) => setRows(response.data || response))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Timetable could not be loaded.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTimetable(); }, []);

  const preview = useMemo(() => previewCsv(csv), [csv]);

  const chooseFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please choose a CSV file.');
      return;
    }
    setFileName(file.name);
    setCsv(await file.text());
  };

  const upload = async () => {
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const result = await adminService.uploadTimetable({ csv, ...metadata });
      setMessage(`${result.data?.length || 0} timetable row(s) published successfully.`);
      setCsv('');
      setFileName('');
      loadTimetable();
    } catch (requestError) {
      const rowErrors = requestError.response?.data?.errors?.map((item) => `Row ${item.row}: ${item.message}`).join(' ');
      setError(rowErrors || requestError.response?.data?.message || 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Administration</p><h1 className="mt-2 text-3xl font-semibold text-white">Exam timetable</h1><p className="mt-1 text-sm text-slate-400">Upload real student exam rows to activate subject-specific lockout windows.</p></div>
        <button type="button" onClick={loadTimetable} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"><RefreshCw size={15} /> Refresh</button>
      </header>

      <section className="rounded-lg border border-cyan-300/20 bg-slate-950/55 p-5 shadow-panel">
        <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cyan-300/10 text-cyan-200"><UploadCloud size={19} /></div><div><h2 className="text-lg font-semibold text-white">Upload CSV</h2><p className="mt-1 text-sm text-slate-400">Required columns: <span className="font-mono text-cyan-200">student_id, subject, exam_date, start_time, end_time</span></p></div></div>
  <div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="text-sm text-slate-300">Department<input value={metadata.department} onChange={(event) => setMetadata({ ...metadata, department: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Semester<input type="number" min="1" max="8" value={metadata.semester} onChange={(event) => setMetadata({ ...metadata, semester: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Exam type<select value={metadata.exam_type} onChange={(event) => setMetadata({ ...metadata, exam_type: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2.5 text-white"><option value="internal">Internal</option><option value="mid_sem">Mid-semester</option><option value="end_sem">End-semester</option><option value="practical">Practical</option><option value="viva">Viva</option></select></label></div>
  <label className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-cyan-300/30 bg-cyan-300/5 px-4 py-8 text-center hover:bg-cyan-300/10"><input type="file" accept=".csv,text/csv" onChange={chooseFile} className="sr-only" /><span><FileUp className="mx-auto text-cyan-200" size={24} /><span className="mt-2 block text-sm font-semibold text-white">{fileName || 'Choose a CSV file'}</span><span className="mt-1 block text-xs text-slate-500">The file is read locally before you publish it.</span></span></label>
  {preview.rows.length > 0 && <div className="mt-4 overflow-x-auto rounded-md border border-white/10"><div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Preview · first {preview.rows.length} rows</div><table className="w-full min-w-[600px] text-left text-xs"><thead className="bg-white/[0.03] text-slate-400"><tr>{preview.headers.map((header) => <th key={header} className="p-3">{header}</th>)}</tr></thead><tbody>{preview.rows.map((row, index) => <tr key={index} className="border-t border-white/5">{preview.headers.map((header) => <td key={header} className="p-3 text-slate-300">{row[header]}</td>)}</tr>)}</tbody></table></div>}
  {error && <p className="mt-4 rounded-md border border-rose-300/25 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">{error}</p>}
  {message && <p className="mt-4 flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100"><CheckCircle2 size={16} />{message}</p>}
  <button type="button" onClick={upload} disabled={!csv.trim() || uploading} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{uploading ? <LoaderCircle size={16} className="animate-spin" /> : <UploadCloud size={16} />}{uploading ? 'Publishing...' : 'Publish timetable'}</button>
      </section>

      <section className="space-y-3"><div className="flex items-center gap-2"><CalendarDays size={18} className="text-cyan-300" /><h2 className="text-lg font-semibold text-white">Published timetable</h2><span className="text-sm text-slate-500">{rows.length} row(s)</span></div>{loading ? <div className="flex min-h-[180px] items-center justify-center"><LoaderCircle className="animate-spin text-cyan-300" /></div> : rows.length === 0 ? <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">No timetable rows have been uploaded yet.</div> : <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950/55 shadow-panel"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">Student ID</th><th className="p-4">Subject</th><th className="p-4">Exam date</th><th className="p-4">Time</th><th className="p-4">Lockout ends</th><th className="p-4">Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row._id} className="border-b border-white/5 last:border-0"><td className="p-4 font-mono text-cyan-200">{row.student_id}</td><td className="p-4 text-white">{row.subject}</td><td className="p-4 text-slate-300">{new Date(row.exam_date).toLocaleDateString()}</td><td className="p-4 text-slate-300">{row.start_time}–{row.end_time}</td><td className="p-4 text-slate-400">{new Date(row.lockout_end).toLocaleString()}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.is_manually_unlocked ? 'bg-amber-300/10 text-amber-200' : 'bg-cyan-300/10 text-cyan-200'}`}>{row.is_manually_unlocked ? 'Manually unlocked' : 'Enforced'}</span></td></tr>)}</tbody></table></div>}</section>
    </section>
  );
}
