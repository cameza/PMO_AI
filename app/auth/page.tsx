'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Check your email for a confirmation link.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          router.push('/');
          router.refresh();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center font-jakarta p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">Portfolio AI</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Executive Dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl shadow-glass border border-white/10 p-8">
          <h2 className="text-lg font-semibold text-white mb-1 text-center">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-slate-400 mb-6 text-center">
            {isSignUp ? 'Sign up to get started' : 'Sign in to your dashboard'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-deep border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-violet/50 focus:border-accent-violet/50 transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-deep border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-violet/50 focus:border-accent-violet/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-xl px-4 py-2.5 text-sm text-accent-rose">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl px-4 py-2.5 text-sm text-accent-emerald">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-accent-violet to-fuchsia-500 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submitting
                ? (isSignUp ? 'Creating account...' : 'Signing in...')
                : (isSignUp ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-slate-400 hover:text-accent-violet transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don\u0027t have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
