'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="h-screen bg-deep flex items-center justify-center font-jakarta p-6">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-glass border border-white/10 p-8 text-center text-sm">
        <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
        <pre className="text-left text-xs text-accent-rose bg-deep rounded-xl p-4 mb-4 overflow-auto max-h-48 whitespace-pre-wrap">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={() => reset()}
          className="w-full bg-accent-violet text-white font-semibold py-2.5 rounded-xl hover:bg-accent-violet/80 transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
