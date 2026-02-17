'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Finishing sign-in...');

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      const authError = searchParams.get('error_description') || searchParams.get('error');
      if (authError) {
        setMessage(decodeURIComponent(authError));
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        const { error } = await getSupabase().auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
      const { data: { session } } = await getSupabase().auth.getSession();

      if (!active) return;

      if (session?.user) {
        window.location.href = '/dashboard';
        return;
      }

      setMessage('Email link is invalid or has expired. Please try signing up again.');
    }

    handleCallback();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-white mb-3">Confirming your account</h1>
        <p className="text-sm text-slate-300">{message}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-4 py-2 rounded-lg bg-accent-violet text-white text-sm font-medium hover:bg-accent-violet/80 transition-colors"
        >
          Back to landing
        </button>
      </div>
    </div>
  );
}
