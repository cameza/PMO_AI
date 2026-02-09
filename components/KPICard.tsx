'use client';

import { useEffect, useRef, useState } from 'react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    subtitleColor?: string;
    tags?: { label: string; color: string }[];
    progress?: number;
    progressColor?: string;
    glowColor?: 'emerald' | 'amber' | 'rose' | 'violet' | 'blue';
    onClick?: () => void;
    className?: string;
}

function AnimatedNumber({ value }: { value: string | number }) {
    const [display, setDisplay] = useState<string>('');
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        const str = String(value);
        // Extract leading number for count-up
        const match = str.match(/^(\d+)/);
        if (!match) {
            setDisplay(str);
            return;
        }

        const target = parseInt(match[1], 10);
        const suffix = str.slice(match[1].length);
        const duration = 1200;
        const steps = 30;
        const stepTime = duration / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += Math.ceil(target / steps);
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            setDisplay(`${current}${suffix}`);
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    return <>{display || value}</>;
}

const glowShadowMap: Record<string, string> = {
    emerald: 'shadow-glow-emerald',
    amber: 'shadow-glow-amber',
    rose: 'shadow-glow-rose',
    violet: 'shadow-glow-violet',
    blue: 'shadow-glow-blue',
};

export function KPICard({
    title,
    value,
    subtitle,
    subtitleColor = 'text-accent-violet',
    tags,
    progress,
    progressColor = 'bg-accent-emerald',
    glowColor,
    onClick,
    className = '',
}: KPICardProps) {
    const glow = glowColor ? glowShadowMap[glowColor] : '';

    return (
        <div 
            className={`bg-surface rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all duration-200 h-full flex flex-col justify-between ${glow} ${className}`}
            onClick={onClick}
        >
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {title}
                </p>
                <p className="text-3xl font-extrabold text-white mb-1 tracking-tight">
                    <AnimatedNumber value={value} />
                </p>
                {subtitle && (
                    <p className={`text-sm ${subtitleColor}`}>
                        {subtitle}
                    </p>
                )}
            </div>

            <div>
                {tags && tags.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className={`text-xs px-2 py-1 rounded-full font-medium ${tag.color}`}
                            >
                                {tag.label}
                            </span>
                        ))}
                    </div>
                )}

                {progress !== undefined && (
                    <div className="mt-3">
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
