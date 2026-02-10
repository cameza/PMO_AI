'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, Legend, LabelList } from 'recharts';

interface CadenceData {
    month: string;
    count: number;
    isCurrent: boolean;
}

interface LaunchCadenceChartProps {
    data: CadenceData[];
    compact?: boolean;
    onBarClick?: (month: string) => void;
}

export function LaunchCadenceChart({ data, compact = false, onBarClick }: LaunchCadenceChartProps) {
    return (
        <div className={`bg-surface rounded-xl border border-white/10 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
            <h3 className={`font-semibold text-slate-400 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Launch Cadence
            </h3>
            <div className={`flex-1 ${compact ? 'min-h-[160px]' : 'h-48'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 5, left: -20, bottom: 0 }}
                        barSize={compact ? 20 : 32}
                    >
                        <defs>
                            <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#4c1d95" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="cadenceGradientCurrent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00ff88" />
                                <stop offset="100%" stopColor="#00cc66" />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: compact ? 10 : 12, fill: '#94a3b8' }}
                            dy={5}
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
                            dataKey="count"
                            name="Launches"
                            radius={[4, 4, 0, 0]}
                            cursor={onBarClick ? 'pointer' : undefined}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={onBarClick ? (entry: any) => onBarClick(entry.month) : undefined}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isCurrent ? 'url(#cadenceGradientCurrent)' : 'url(#cadenceGradient)'}
                                />
                            ))}
                            <LabelList
                                dataKey="count"
                                position="top"
                                style={{
                                    fontSize: compact ? 10 : 12,
                                    fontWeight: 600,
                                    fill: '#94a3b8'
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
