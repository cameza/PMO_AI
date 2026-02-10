'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AlignmentData {
    productLine: string;
    onTrack: number;
    atRisk: number;
    offTrack: number;
}

interface StrategicAlignmentChartProps {
    data: AlignmentData[];
    compact?: boolean;
    onBarClick?: (status: string, productLine: string) => void;
}

export function StrategicAlignmentChart({ data, compact = false, onBarClick }: StrategicAlignmentChartProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (statusKey: string) => (entry: any) => {
        if (onBarClick) {
            const statusMap: Record<string, string> = { onTrack: 'On Track', atRisk: 'At Risk', offTrack: 'Off Track' };
            onBarClick(statusMap[statusKey], entry.productLine);
        }
    };
    return (
        <div className={`bg-surface rounded-xl border border-white/10 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
            <h3 className={`font-semibold text-slate-400 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Strategic Alignment
            </h3>
            <div className={`flex-1 ${compact ? 'min-h-[160px]' : 'h-48'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                        barSize={compact ? 20 : 32}
                    >
                        <defs>
                            <linearGradient id="onTrackGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id="atRiskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                            <linearGradient id="offTrackGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" />
                                <stop offset="100%" stopColor="#e11d48" />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="productLine"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: compact ? 10 : 12, fill: '#94a3b8' }}
                            dy={5}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backgroundColor: '#1a1b2e', color: '#e2e8f0' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            labelStyle={{ color: '#94a3b8' }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: compact ? '10px' : '12px', paddingTop: '10px', color: '#94a3b8' }}
                            iconSize={8}
                        />
                        <Bar
                            dataKey="onTrack"
                            name="On Track"
                            stackId="status"
                            fill="url(#onTrackGradient)"
                            radius={[0, 0, 4, 4]}
                            cursor={onBarClick ? 'pointer' : undefined}
                            onClick={onBarClick ? handleClick('onTrack') : undefined}
                        />
                        <Bar
                            dataKey="atRisk"
                            name="At Risk"
                            stackId="status"
                            fill="url(#atRiskGradient)"
                            cursor={onBarClick ? 'pointer' : undefined}
                            onClick={onBarClick ? handleClick('atRisk') : undefined}
                        />
                        <Bar
                            dataKey="offTrack"
                            name="Off Track"
                            stackId="status"
                            fill="url(#offTrackGradient)"
                            radius={[4, 4, 0, 0]}
                            cursor={onBarClick ? 'pointer' : undefined}
                            onClick={onBarClick ? handleClick('offTrack') : undefined}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
