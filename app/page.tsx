'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { ArrowRight, Play, Menu, X } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { ProductShowcase } from '@/components/ProductShowcase';
import { ProblemSection } from '@/components/ProblemSection';
import { SolutionSection } from '@/components/SolutionSection';
import { DayInLifeSection } from '@/components/DayInLifeSection';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 font-jakarta">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0b10]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center h-20">
            {/* Centered Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">P</span>
              </div>
              <span className="text-xl font-semibold text-white">Portfolio AI</span>
            </div>
            
            {/* Desktop Log In Button */}
            <div className="hidden md:block absolute right-6 lg:right-8">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-2 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-medium transition-all"
              >
                Log In
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden absolute right-6 text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4">
              <button
                onClick={() => {
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full px-6 py-2 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-medium transition-all text-left"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with AI Glow */}
        <div className="absolute inset-0 bg-[#0a0b10]">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px]" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.h1
                className="text-5xl md:text-7xl font-semibold tracking-tight text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                The Portfolio That{' '}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  Explains Itself
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-gray-300 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Stop chasing status updates. Use RAG-powered AI to turn fragmented program data into{' '}
                <span className="text-white font-semibold">executive-ready strategic insights</span> in seconds.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl font-medium group transition-all"
                >
                  Get Started
                  <ArrowRight className="ml-2 inline size-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white px-8 py-6 text-lg rounded-xl font-medium transition-all"
                >
                  <Play className="mr-2 inline size-5" />
                  View Dashboard
                </button>
              </motion.div>
            </motion.div>

            {/* Right: Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                {/* Mock Dashboard Query */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400">Executive Command Center</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                    <div className="text-sm text-gray-400 mb-2">Query</div>
                    <div className="text-white font-medium">
                      &quot;Which programs in the Smart Home line are currently at risk?&quot;
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-400 font-semibold">Project Titan</span>
                        <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs">High Risk</span>
                      </div>
                      <p className="text-sm text-gray-300">Vendor delay detected in Q2 milestone</p>
                    </div>

                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-400 font-semibold">Nova Platform</span>
                        <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">On Track</span>
                      </div>
                      <p className="text-sm text-gray-300">7 of 9 objectives covered</p>
                    </div>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-2xl blur-xl -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <ProductShowcase />

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Day in Life Section */}
      <DayInLifeSection />

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
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
  );
}

