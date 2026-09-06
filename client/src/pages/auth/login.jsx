import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Building2, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

export const roleRedirects = {
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  hod: '/hod/dashboard',
  admin: '/admin/dashboard',
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [gmail, setGmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const handledCode = useRef('');

  const ssoUrl = useMemo(() => {
    const configuredUrl = import.meta.env.VITE_SSO_AUTH_URL;
    if (!configuredUrl) return '';
    const url = new URL(configuredUrl);
    url.searchParams.set('client_id', import.meta.env.VITE_SSO_CLIENT_ID || '');
    url.searchParams.set('redirect_uri', import.meta.env.VITE_SSO_REDIRECT_URI || `${window.location.origin}/login`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', import.meta.env.VITE_SSO_SCOPE || 'openid profile email');
    return url.toString();
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || handledCode.current === code) return;
    handledCode.current = code;
    setBusy(true);
    login({ code })
      .then(({ user }) => navigate(roleRedirects[user.role] || '/unauthorized', { replace: true }))
      .catch(() => setError('We could not complete institutional sign-in. Please try again.'))
      .finally(() => setBusy(false));
  }, [login, navigate, searchParams]);

  const startSso = () => {
    setError('');
    if (!ssoUrl) {
      setError('Institutional SSO is not configured for this environment.');
      return;
    }
    window.location.assign(ssoUrl);
  };

  const useDevelopmentLogin = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { user } = await login({ devEmail: gmail, devPassword });
      navigate(roleRedirects[user.role] || '/unauthorized', { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Check the seeded email and password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden bg-ink px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600"><ShieldCheck size={21} /></span><span className="text-lg font-semibold">AI Buddy</span></div>
        <div className="max-w-lg"><p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Institutional learning support</p><h1 className="text-5xl font-semibold leading-tight tracking-tight">A calmer way to move through your semester.</h1><p className="mt-6 max-w-md text-base leading-7 text-slate-300">One secure workspace for academic guidance, faculty support, and department operations.</p></div>
        <p className="text-sm text-slate-400">Connected to your institution&apos;s identity provider.</p>
      </section>
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-white"><ShieldCheck size={21} /></span><span className="text-lg font-semibold text-ink">AI Buddy</span></div>
          <div className="mb-8"><div className="mb-5 inline-flex rounded-xl bg-amber-100 p-3 text-amber-700"><Building2 size={22} /></div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Welcome back</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Sign in to your workspace</h2><p className="mt-3 text-slate-600">Use your institutional account to continue.</p></div>
          <button type="button" disabled={busy} onClick={startSso} className="flex w-full items-center justify-between rounded-xl bg-teal-700 px-5 py-4 font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-70"><span>{busy ? 'Connecting to SSO...' : 'Continue with institutional SSO'}</span>{busy ? <LoaderCircle className="animate-spin" size={19} /> : <ArrowRight size={19} />}</button>
          {import.meta.env.DEV && <form onSubmit={useDevelopmentLogin} className="mt-6 border-t border-slate-200 pt-6">
            <label htmlFor="dev-gmail" className="text-sm font-semibold text-slate-700">Local development login</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input id="dev-gmail" type="email" required value={gmail} onChange={(event) => setGmail(event.target.value)} placeholder="student@seed.dev or you@gmail.com" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-ink outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              <input id="dev-password" type="password" value={devPassword} onChange={(event) => setDevPassword(event.target.value)} placeholder="Seed password (optional for Gmail)" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-ink outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              <button type="submit" disabled={busy} className="rounded-xl border border-teal-700 px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60">Sign in</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Use the README password for a seeded role, or leave it blank for a temporary student Gmail profile.</p>
          </form>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <p className="mt-8 text-center text-xs leading-5 text-slate-500">Access is managed by your institution. Contact IT support if your account or role is incorrect.</p>
        </div>
      </main>
    </div>
  );
};

export default Login;