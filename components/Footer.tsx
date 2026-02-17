'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { ExpressiveEye } from './ExpressiveEye';

export function Footer() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <footer className="relative py-32 bg-[#0a0b10]">
      {/* Dramatic Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-gradient-to-b from-violet-600/20 to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          {/* Expressive Eye */}
          <div className="flex justify-center mb-8">
            <ExpressiveEye size="lg" emotion="focused" enableTracking={true} />
          </div>

          <h2 className="text-4xl md:text-6xl font-semibold text-white mb-6 tracking-tight max-w-4xl mx-auto">
            Ready to eliminate the{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              manual status report
            </span>
            ?
          </h2>

          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Transform your program portfolio into an AI-powered command center. 
            Get executive-ready insights in seconds, not days.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all"
          >
            Get Started
            <ArrowRight className="size-5" />
          </motion.button>

          {/* Auth Modal */}
          {authModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setAuthModalOpen(false)}
              />
              
              {/* Modal Content */}
              <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-2">Get Started</h3>
                  <p className="text-gray-400 mb-6">Transform your program portfolio with AI-powered insights.</p>
                  <button
                    onClick={() => setAuthModalOpen(false)}
                    className="w-full rounded-lg py-3 text-white font-medium bg-gradient-to-r from-accent-violet to-fuchsia-500 hover:from-accent-violet/90 hover:to-fuchsia-500/90 transition-all"
                  >
                    Sign In to Continue
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-12" />

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-12 mb-12"
        >
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm"
        >
          <div>© 2026 Portfolio AI. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
