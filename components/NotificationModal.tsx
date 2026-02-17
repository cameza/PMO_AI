'use client';

import { useState } from 'react';
import { X, Database, RefreshCw, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { captureLead, type LeadCaptureRequest } from '@/lib/api';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataSource: 'manual' | 'synced';
}

export function NotificationModal({ isOpen, onClose, dataSource }: NotificationModalProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) return;
        
        setIsSubmitting(true);
        setSubmitStatus('idle');
        
        try {
            const leadData: LeadCaptureRequest = {
                email: email.trim(),
                name: name.trim() || undefined,
                company: company.trim() || undefined,
                source: 'demo_notification'
            };
            
            await captureLead(leadData);
            setSubmitStatus('success');
            
            // Clear form after successful submission
            setTimeout(() => {
                setEmail('');
                setName('');
                setCompany('');
                setSubmitStatus('idle');
            }, 3000);
            
        } catch (error) {
            console.error('Failed to capture lead:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />
                    
                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-surface border border-white/10 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-lg flex items-center justify-center">
                                            <AlertCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Demo Mode Active</h2>
                                            <p className="text-sm text-slate-400">You're viewing sample data</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Description */}
                                <div className="text-sm text-slate-300 leading-relaxed">
                                    <p className="mb-4">
                                        Welcome to PMO AI! You're currently exploring our demo with sample portfolio data. 
                                        This showcases how our AI-powered program management system works with real-world scenarios.
                                    </p>
                                    <p>
                                        PMO AI helps executives get instant insights into their program portfolios, 
                                        identify risks, and make data-driven decisions.
                                    </p>
                                </div>

                                {/* Mode Comparison */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-white">Available Modes</h3>
                                    
                                    {/* Standalone Mode */}
                                    <div className={`p-4 rounded-xl border transition-all ${
                                        dataSource === 'manual' 
                                            ? 'bg-accent-violet/10 border-accent-violet/30' 
                                            : 'bg-white/5 border-white/10'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <Database className="w-5 h-5 text-accent-violet mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-white">Standalone Mode</h4>
                                                    {dataSource === 'manual' && (
                                                        <span className="px-2 py-0.5 bg-accent-violet/20 text-accent-violet text-xs rounded-full">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    Built-in demo database for exploration and testing. Perfect for getting familiar with the platform.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linear Integration Mode */}
                                    <div className={`p-4 rounded-xl border transition-all ${
                                        dataSource === 'synced' 
                                            ? 'bg-accent-emerald/10 border-accent-emerald/30' 
                                            : 'bg-white/5 border-white/10'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <RefreshCw className="w-5 h-5 text-accent-emerald mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-white">Linear Integration</h4>
                                                    {dataSource === 'synced' && (
                                                        <span className="px-2 py-0.5 bg-accent-emerald/20 text-accent-emerald text-xs rounded-full">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    Real-time data sync from Linear. See your actual program portfolio with live updates.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Capture Form */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white">Interested in Real Integration?</h3>
                                    <p className="text-xs text-slate-400">
                                        Leave your email and we'll help you connect PMO AI to your actual data sources.
                                    </p>
                                    
                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Work email*"
                                                required
                                                disabled={isSubmitting}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet/50 focus:ring-2 focus:ring-accent-violet/20 disabled:opacity-50"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Name (optional)"
                                                disabled={isSubmitting}
                                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet/50 focus:ring-2 focus:ring-accent-violet/20 disabled:opacity-50"
                                            />
                                            
                                            <input
                                                type="text"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                placeholder="Company (optional)"
                                                disabled={isSubmitting}
                                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet/50 focus:ring-2 focus:ring-accent-violet/20 disabled:opacity-50"
                                            />
                                        </div>

                                        {/* Submit Status Messages */}
                                        {submitStatus === 'success' && (
                                            <div className="flex items-center gap-2 p-3 bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-accent-emerald" />
                                                <span className="text-sm text-accent-emerald">Thanks! We'll be in touch soon.</span>
                                            </div>
                                        )}
                                        
                                        {submitStatus === 'error' && (
                                            <div className="flex items-center gap-2 p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-lg">
                                                <AlertCircle className="w-4 h-4 text-accent-rose" />
                                                <span className="text-sm text-accent-rose">Something went wrong. Please try again.</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !email.trim() || submitStatus === 'success'}
                                            className="w-full bg-gradient-to-r from-accent-violet to-fuchsia-500 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="w-4 h-4" />
                                                    Get in Touch
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
