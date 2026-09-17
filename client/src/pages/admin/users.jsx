import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Search, ShieldCheck, UserRound, UserX, X } from 'lucide-react';
import { adminService } from '@services/api.service';

const emptyForm = { name: '', email: '', password: '', role: 'student', department: '', semester: '' };

export default function Users() {
	const [users, setUsers] = useState([]);
	const [search, setSearch] = useState('');
	const [role, setRole] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [form, setForm] = useState(emptyForm);
	const [showForm, setShowForm] = useState(false);
	const [saving, setSaving] = useState(false);

	const loadUsers = () => {
		setLoading(true);
		setError('');
		adminService.getUsers({ search: search || undefined, role: role || undefined })
			.then((response) => setUsers(response.data || []))
			.catch((requestError) => setError(requestError.response?.data?.message || 'Users could not be loaded.'))
			.finally(() => setLoading(false));
	};

	useEffect(() => { loadUsers(); }, [role]);

	const createUser = async (event) => {
		event.preventDefault();
		setSaving(true);
		setError('');
		try {
			await adminService.createUser({ ...form, semester: form.semester || undefined });
			setForm(emptyForm);
			setShowForm(false);
			loadUsers();
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'User could not be created.');
		} finally {
			setSaving(false);
		}
	};

	const toggleUser = async (user) => {
		try {
			if (user.is_active) await adminService.deactivateUser(user._id);
			else await adminService.updateUser(user._id, { is_active: true });
			loadUsers();
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'User status could not be updated.');
		}
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div><p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Administration</p><h1 className="mt-2 text-3xl font-semibold text-white">User administration</h1><p className="mt-1 text-sm text-slate-400">Manage accounts, roles, departments, and access status.</p></div>
				<button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-slate-950"><Plus size={17} /> Add user</button>
			</header>

			{error && <div className="rounded-md border border-rose-300/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</div>}

			<section className="rounded-lg border border-white/10 bg-slate-950/55 p-4 shadow-panel"><div className="flex flex-wrap gap-3"><label className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadUsers()} placeholder="Search name or email" className="w-full rounded-md border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" /></label><select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-md border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white"><option value="">All roles</option><option value="student">Students</option><option value="faculty">Faculty</option><option value="hod">HODs</option><option value="admin">Admins</option></select><button type="button" onClick={loadUsers} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200"><RefreshCw size={15} /> Refresh</button></div></section>

			<section className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950/55 shadow-panel"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Department</th><th className="p-4">Semester</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading users...</td></tr> : users.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-slate-400">No users found.</td></tr> : users.map((user) => <tr key={user._id} className="border-b border-white/5 last:border-0"><td className="p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-300/10 text-cyan-200"><UserRound size={17} /></span><div><p className="font-semibold text-white">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div></div></td><td className="p-4"><span className="inline-flex items-center gap-1.5 capitalize text-slate-300"><ShieldCheck size={14} className="text-violet-300" />{user.role}</span></td><td className="p-4 text-slate-300">{user.department}</td><td className="p-4 text-slate-400">{user.semester || '—'}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-300/10 text-emerald-200' : 'bg-rose-300/10 text-rose-200'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td><td className="p-4 text-right"><button type="button" onClick={() => toggleUser(user)} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">{user.is_active ? <UserX size={14} /> : <ShieldCheck size={14} />}{user.is_active ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></section>

			{showForm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><form onSubmit={createUser} className="w-full max-w-xl rounded-lg border border-white/15 bg-slate-950 p-6 shadow-panel"><div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold text-white">Add user</h2><p className="mt-1 text-sm text-slate-400">Create an account with the correct role and department.</p></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close form" className="rounded p-2 text-slate-400 hover:bg-white/10"><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Temporary password<input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2.5 text-white"><option value="student">Student</option><option value="faculty">Faculty</option><option value="hod">HOD</option><option value="admin">Admin</option></select></label><label className="text-sm text-slate-300 sm:col-span-2">Department<input required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Semester<input type="number" min="1" max="8" value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-white/10 px-4 py-2.5 text-sm text-slate-300">Cancel</button><button disabled={saving} type="submit" className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-slate-950">{saving ? 'Creating...' : 'Create user'}</button></div></form></div>}
		</div>
	);
}
