import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Building2, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import ThreeBackground from '@components/three/ThreeBackground';

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
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#090d16' }}>
      {/* Full-screen 3D cosmic background */}
      <ThreeBackground variant="login" />

      {/* Centered glassmorphic login card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div
          className="w-full max-w-md rounded-3xl border border-white/[0.12] p-8 shadow-2xl sm:p-10"
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(129, 140, 248, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Logo & Brand */}
          <div className="mb-8 flex items-center gap-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.9), rgba(56, 189, 248, 0.4))',
                boxShadow: '0 0 20px rgba(129, 140, 248, 0.3)',
              }}
            >
              <ShieldCheck size={22} />
            </span>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">AI Buddy</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/70">Institutional Learning</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 px-3 py-1.5" style={{ background: 'rgba(129, 140, 248, 0.08)' }}>
              <Building2 size={14} className="text-indigo-300" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-300">Welcome back</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Sign in to your{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">workspace</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Sign in with your email or institutional SSO to continue.
            </p>
          </div>

          {/* Quick Seed Login (Dev only) */}
          {import.meta.env.DEV && (
            <div
              className="mb-5 rounded-2xl border border-indigo-400/15 p-4"
              style={{ background: 'rgba(129, 140, 248, 0.06)' }}
            >
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300/80">Quick Seed Login</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { role: 'Student', email: 'student@seed.dev', pass: 'Student@12345' },
                  { role: 'Faculty', email: '2024.hitarthp@isu.ac.in', pass: 'Faculty@12345' },
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
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:text-white"
                    style={{ background: 'rgba(15, 23, 42, 0.5)' }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={useDevelopmentLogin} className="space-y-4">
            <div>
              <label htmlFor="dev-gmail" className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-300">
                Email address
              </label>
              <input
                id="dev-gmail"
                type="email"
                required
                value={gmail}
                onChange={(event) => setGmail(event.target.value)}
                placeholder="student@seed.dev or email@domain.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-400/15"
              />
            </div>

            <div>
              <label htmlFor="dev-password" className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-300">
                Password
              </label>
              <input
                id="dev-password"
                type="password"
                value={devPassword}
                onChange={(event) => setDevPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-400/15"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition disabled:cursor-wait disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.9) 0%, rgba(99, 102, 241, 0.7) 100%)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
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

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500" style={{ background: 'rgba(15, 23, 42, 0.65)' }}>
              Or
            </span>
          </div>

          {/* SSO Button */}
          <button
            type="button"
            disabled={busy}
            onClick={startSso}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white disabled:cursor-wait disabled:opacity-60"
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <span>Continue with institutional SSO</span>
          </button>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-400/20 p-4 text-sm text-red-300"
              style={{ background: 'rgba(239, 68, 68, 0.08)' }}
            >
              {error}
            </p>
          )}

          {/* Footer note */}
          <p className="mt-7 text-center text-[11px] leading-5 text-slate-500">
            Access is managed by your institution.<br />Contact IT support if your account or role is incorrect.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;