'use client';

import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function AuthModal({
  isOpen,
  onClose,
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
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400">
            {isSignUp 
              ? 'Get started with Portfolio AI today' 
              : 'Sign in to access your dashboard'
            }
          </p>
        </div>

        {/* Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              !isSignUp 
                ? 'bg-accent-violet text-white' 
                : 'bg-deep text-gray-400 hover:bg-white/5'
            }`}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              isSignUp 
                ? 'bg-accent-violet text-white' 
                : 'bg-deep text-gray-400 hover:bg-white/5'
            }`}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-deep border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-accent-violet/50 focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-deep border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-accent-violet/50 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-3 text-white font-medium bg-gradient-to-r from-accent-violet to-fuchsia-500 hover:from-accent-violet/90 hover:to-fuchsia-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? '...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Messages */}
        {error && (
          <p className="mt-4 text-sm text-accent-rose">{error}</p>
        )}
        {success && (
          <p className="mt-4 text-sm text-accent-emerald">{success}</p>
        )}
      </div>
    </div>
  );
}
