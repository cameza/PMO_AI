'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Settings, Plus, Bot } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    insights?: { type: 'warning' | 'info'; text: string }[];
}

interface ChatWidgetProps {
    programContext?: string;
}

export function ChatWidget({ programContext }: ChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Strategically, we are seeing **pressure on 2 product lines**. Milestone completion is trending at 72%. Would you like to deep dive into the 3 off-track items?',
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Example conversation flow - adding a sample user question
    const [hasAsked, setHasAsked] = useState(false);

    useEffect(() => {
        // Add sample conversation after initial load
        const timer = setTimeout(() => {
            if (!hasAsked) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: '2',
                        role: 'user',
                        content: 'Show me the risk breakdown for the Smart Home line.',
                    },
                    {
                        id: '3',
                        role: 'assistant',
                        content: 'Smart Home Risk Analysis:',
                        insights: [
                            { type: 'warning', text: 'Hardware supply chain delays for Hub v3 (3-week impact).' },
                            { type: 'info', text: 'Privacy Audit regulatory feedback pending.' },
                        ],
                    },
                ]);
                setHasAsked(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [hasAsked]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'I can help analyze that. Based on the current portfolio data, here\'s what I found...',
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="bg-white h-full flex flex-col border-l border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Portfolio Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-600">Online</span>
                        </div>
                    </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id}>
                        {message.role === 'assistant' ? (
                            <div className="space-y-2">
                                <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-3.5 text-sm text-gray-700 leading-relaxed">
                                    <FormattedContent content={message.content} />
                                </div>
                                {message.insights && (
                                    <div className="space-y-2 pl-1">
                                        {message.insights.map((insight, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full mt-2 ${insight.type === 'warning' ? 'bg-red-500' : 'bg-amber-500'
                                                    }`} />
                                                <span className="text-sm text-gray-600">{insight.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%]">
                                    {message.content}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-3.5 text-sm text-gray-500 animate-pulse w-16">
                        ...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-3 flex gap-2">
                <button className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Generate Report
                </button>
                <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Notify Team
                </button>
            </div>

            {/* Input */}
            <div className="p-4 pt-0">
                <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about strategy..."
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function FormattedContent({ content }: { content: string }) {
    // Simple markdown-like formatting for bold text
    const parts = content.split(/(\*\*[^*]+\*\*)/g);

    return (
        <>
            {parts.map((part, idx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <span key={idx} className="text-blue-600 font-medium">
                            {part.slice(2, -2)}
                        </span>
                    );
                }
                return <span key={idx}>{part}</span>;
            })}
        </>
    );
}
