'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMobileAuth, setShowMobileAuth] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await getSupabase().auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://pmo-ai.vercel.app/auth/callback',
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setSuccess('Check your email to confirm your account.');
      } else {
        const { error: signInError } = await getSupabase().auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during authentication.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="h-screen bg-deep flex items-center justify-center font-jakarta">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep text-slate-200 font-jakarta">
      <header className="border-b border-white/10 bg-deep/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base">P</span>
            </div>
            <div>
              <h1 className="font-semibold text-white text-base tracking-tight">Portfolio AI</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Program Management Intelligence</p>
            </div>
          </div>

          <button
            onClick={() => setShowMobileAuth((prev) => !prev)}
            className="md:hidden text-sm px-3 py-2 rounded-lg border border-white/15 bg-surface text-slate-100"
          >
            {showMobileAuth ? 'Hide auth' : 'Sign in'}
          </button>

          <div className="hidden md:block w-full max-w-md">
            <AuthPanel
              isSignUp={isSignUp}
              setIsSignUp={setIsSignUp}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              success={success}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {showMobileAuth && (
          <div className="md:hidden border-t border-white/10 px-6 pb-4">
            <AuthPanel
              isSignUp={isSignUp}
              setIsSignUp={setIsSignUp}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              error={error}
              success={success}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex items-center px-3 py-1 rounded-full text-xs tracking-wide uppercase border border-accent-violet/40 text-accent-violet bg-accent-violet/10 mb-6">
              AI-native PMO operating system
            </p>
            <h2 className="text-4xl md:text-6xl font-semibold text-white leading-tight">
              Turn fragmented program data into executive clarity.
            </h2>
            <p className="mt-6 text-slate-300 text-lg max-w-xl leading-relaxed">
              Portfolio AI centralizes program, risk, and milestone signals, then gives leaders grounded answers in real time.
              No manual status-hunting. No dashboard drift.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setShowMobileAuth(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-accent-violet to-fuchsia-500 text-white font-medium"
              >
                Get started
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-5 py-3 rounded-xl border border-white/20 text-slate-100 hover:bg-white/5"
              >
                Existing user: dashboard
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['Strategic Alignment', 'See which priorities are underfunded or uncovered.'],
              ['Risk Intelligence', 'Surface cross-line pressure and delivery risk early.'],
              ['Milestone Confidence', 'Track delivery confidence and launch readiness.'],
              ['Portfolio Assistant', 'Ask natural language questions grounded in your data.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-surface p-5 shadow-glass">
                <h3 className="text-white font-semibold">{title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-surface to-surface/70 p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-semibold text-white">Built for portfolio leaders in medium and large organizations.</h3>
            <p className="mt-4 text-slate-300 max-w-3xl">
              Align initiatives to strategy, detect execution pressure, and move faster with AI answers you can trust.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

interface AuthPanelProps {
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  success: string | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

function AuthPanel({
  isSignUp,
  setIsSignUp,
  email,
  setEmail,
  password,
  setPassword,
  error,
  success,
  submitting,
  onSubmit,
}: AuthPanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setIsSignUp(false)}
          className={`text-xs px-3 py-1.5 rounded-lg ${!isSignUp ? 'bg-accent-violet text-white' : 'bg-deep text-slate-400'}`}
          type="button"
        >
          Sign in
        </button>
        <button
          onClick={() => setIsSignUp(true)}
          className={`text-xs px-3 py-1.5 rounded-lg ${isSignUp ? 'bg-accent-violet text-white' : 'bg-deep text-slate-400'}`}
          type="button"
        >
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="bg-deep border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="bg-deep border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent-violet to-fuchsia-500 disabled:opacity-50"
        >
          {submitting ? '...' : isSignUp ? 'Create' : 'Enter'}
        </button>
      </form>

      {error && <p className="text-xs text-accent-rose mt-2">{error}</p>}
      {success && <p className="text-xs text-accent-emerald mt-2">{success}</p>}
    </div>
  );
}
