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
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600">
            <ShieldCheck size={21} />
          </span>
          <span className="text-lg font-semibold">AI Buddy</span>
        </div>
        <div className="max-w-lg">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Institutional learning support</p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">A calmer way to move through your semester.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">One secure workspace for academic guidance, faculty support, and department operations.</p>
        </div>
        <p className="text-sm text-slate-400">Connected to your institution&apos;s identity provider.</p>
      </section>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-700 text-white">
              <ShieldCheck size={21} />
            </span>
            <span className="text-lg font-semibold text-ink">AI Buddy</span>
          </div>

          <div className="mb-8">
            <div className="mb-5 inline-flex rounded-xl bg-amber-100 p-3 text-amber-700">
              <Building2 size={22} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Sign in to your workspace</h2>
            <p className="mt-2 text-slate-600">Sign in with your email or institutional SSO to continue.</p>
          </div>

          {import.meta.env.DEV && (
            <div className="mb-6 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-800">Quick Seed Login (Development)</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { role: 'Student', email: 'student@seed.dev', pass: 'Student@12345' },
                  { role: 'Faculty', email: 'faculty@seed.dev', pass: 'Faculty@12345' },
                  { role: 'HOD', email: 'hod@seed.dev', pass: 'Hod@12345' },
                  { role: 'Admin', email: 'admin@seed.dev', pass: 'Admin@12345' },
                ].map(({ role, email, pass }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setGmail(email);
                      setDevPassword(pass);
                      setError('');
                    }}
                    className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-teal-900 shadow-sm transition hover:bg-teal-700 hover:text-white border border-teal-200"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={useDevelopmentLogin} className="space-y-4">
            <div>
              <label htmlFor="dev-gmail" className="block text-sm font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="dev-gmail"
                type="email"
                required
                value={gmail}
                onChange={(event) => setGmail(event.target.value)}
                placeholder="student@seed.dev or email@domain.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-ink outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label htmlFor="dev-password" className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                id="dev-password"
                type="password"
                value={devPassword}
                onChange={(event) => setDevPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-ink outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (
                <>
                  <span>Signing in...</span>
                  <LoaderCircle className="animate-spin" size={18} />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative bg-paper px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Or</span>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={startSso}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
          >
            <span>Continue with institutional SSO</span>
          </button>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
              {error}
            </p>
          )}

          <p className="mt-8 text-center text-xs leading-5 text-slate-500">
            Access is managed by your institution. Contact IT support if your account or role is incorrect.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;