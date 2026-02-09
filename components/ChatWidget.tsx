'use client';

import { useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Send, Settings, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatWidgetProps {
    programContext?: string;
}

function AIOrb({ isThinking }: { isThinking: boolean }) {
    return (
        <div className="relative w-10 h-10 flex items-center justify-center">
            <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-violet to-fuchsia-500 opacity-40"
                animate={{
                    scale: isThinking ? [1, 1.3, 1] : [1, 1.1, 1],
                    opacity: isThinking ? [0.4, 0.7, 0.4] : [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: isThinking ? 1 : 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <div className="relative w-10 h-10 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full opacity-90" />
            </div>
        </div>
    );
}

const WELCOME_MESSAGE = `# Portfolio Assistant 👋

Welcome! I'm your AI-powered portfolio assistant. I can help you analyze and navigate your program portfolio.

## Try asking me:
• What programs are at risk?
• Show me upcoming launches
• Which programs need attention?
• How's our pipeline health?
• What are the biggest risks right now?

I have access to real-time portfolio data and can provide insights on programs, risks, and milestones.`;

const PROGRAM_WELCOME = `Hello! I'm your dedicated assistant for this program. I can help with risk mitigation strategies or next steps. What would you like to know?`;

export function ChatWidget({ programContext }: ChatWidgetProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
        api: '/api/chat',
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant' as const,
                content: programContext ? PROGRAM_WELCOME : WELCOME_MESSAGE,
            },
        ],
        body: {
            programContext,
        },
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AIOrb isThinking={isLoading} />
                    <div>
                        <h3 className="font-bold text-white text-sm tracking-tight">Portfolio Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-accent-amber animate-pulse' : 'bg-accent-emerald'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isLoading ? 'text-accent-amber' : 'text-accent-emerald'}`}>
                                {isLoading ? 'Thinking...' : 'Online'}
                            </span>
                        </div>
                    </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id}>
                        {message.role === 'assistant' ? (
                            <div className="space-y-2">
                                <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3.5 text-sm text-slate-300 leading-relaxed border border-white/5">
                                    <FormattedContent content={message.content} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <div className="bg-gradient-to-r from-accent-violet to-fuchsia-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%]">
                                    {message.content}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {error && (
                    <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-2xl p-3.5 text-sm text-accent-rose">
                        Sorry, I encountered an error. Please check that your API keys are configured.
                    </div>
                )}

                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3.5 text-sm text-slate-500 animate-pulse w-16 border border-white/5">
                        ...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 pt-0">
                <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10 focus-within:border-accent-violet/50 focus-within:ring-2 focus-within:ring-accent-violet/20 transition-all">
                    <button type="button" className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <Plus className="w-4 h-4 text-slate-500" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask about strategy..."
                        className="flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder-slate-500"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-8 h-8 bg-accent-violet hover:bg-accent-violet/80 disabled:bg-white/10 rounded-full flex items-center justify-center transition-colors"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </form>
            </div>
        </div>
    );
}

function FormattedContent({ content }: { content: string }) {
    // Enhanced markdown-like formatting
    const formatContent = (text: string) => {
        // Split into lines and process each
        const lines = text.split('\n');
        const processedLines = lines.map(line => {
            // Headers
            if (line.startsWith('# ')) {
                return `<h1 class="text-lg font-bold text-white mb-2">${line.slice(2)}</h1>`;
            }
            if (line.startsWith('## ')) {
                return `<h2 class="text-base font-semibold text-slate-200 mb-2">${line.slice(3)}</h2>`;
            }
            if (line.startsWith('### ')) {
                return `<h3 class="text-sm font-semibold text-slate-200 mb-1">${line.slice(4)}</h3>`;
            }
            
            // Bullet points
            if (line.startsWith('• ')) {
                return `<div class="flex items-start gap-2"><span class="text-slate-500 mt-0.5">•</span><span class="text-slate-300">${line.slice(2)}</span></div>`;
            }
            if (line.startsWith('- ')) {
                return `<div class="flex items-start gap-2"><span class="text-slate-500 mt-0.5">•</span><span class="text-slate-300">${line.slice(2)}</span></div>`;
            }
            
            // Bold text
            line = line.replace(/\*\*([^*]+)\*\*/g, '<span class="text-accent-violet font-medium">$1</span>');
            
            // Regular text (non-empty)
            if (line.trim()) {
                return `<span class="inline">${line}</span>`;
            }
            
            return '';
        });
        
        // Join lines with proper spacing
        return processedLines.join('');
    };

    return (
        <div 
            className="text-sm text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
        />
    );
}
