'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';

interface VelocityData {
    stage: string;
    count: number;
}

interface ProgramVelocityChartProps {
    data: VelocityData[];
    compact?: boolean;
    onBarClick?: (stage: string) => void;
}

export function ProgramVelocityChart({ data, compact = false, onBarClick }: ProgramVelocityChartProps) {
    // Custom Y-axis tick that never wraps text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderTick = (props: any) => {
        const { x, y, payload } = props;
        return (
            <text
                x={x}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#94a3b8"
                fontSize={compact ? 11 : 12}
                style={{ whiteSpace: 'nowrap' }}
            >
                {payload.value}
            </text>
        );
    };

    return (
        <div className={`bg-surface rounded-xl border border-white/10 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
            <h3 className={`font-semibold text-slate-400 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Program Velocity
            </h3>
            <div className={`flex-1 ${compact ? 'min-h-[160px]' : 'h-48'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 25, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="velocityGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#d946ef" />
                            </linearGradient>
                        </defs>
                        <XAxis type="number" hide domain={[0, 'dataMax + 2']} />
                        <YAxis
                            type="category"
                            dataKey="stage"
                            axisLine={false}
                            tickLine={false}
                            tick={renderTick}
                            width={compact ? 70 : 80}
                        />
                        <Bar
                            dataKey="count"
                            radius={[0, 4, 4, 0]}
                            barSize={compact ? 24 : 28}
                            fill="url(#velocityGradient)"
                            cursor={onBarClick ? 'pointer' : undefined}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={onBarClick ? (entry: any) => onBarClick(entry.stage) : undefined}
                        >
                            <LabelList
                                dataKey="count"
                                position="right"
                                style={{ fontSize: 12, fontWeight: 600, fill: '#a78bfa' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
