'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from 'recharts';

interface AlignmentData {
    productLine: string;
    onTrack: number;
    atRisk: number;
    offTrack: number;
}

interface StrategicAlignmentChartProps {
    data: AlignmentData[];
    compact?: boolean;
}

export function StrategicAlignmentChart({ data, compact = false }: StrategicAlignmentChartProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
            <h3 className={`font-semibold text-gray-700 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Strategic Alignment
            </h3>
            <div className={`flex-1 ${compact ? 'min-h-[160px]' : 'h-48'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                        barSize={compact ? 20 : 32}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="productLine"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: compact ? 10 : 12, fill: '#64748b' }}
                            dy={5}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: compact ? '10px' : '12px', paddingTop: '10px' }}
                            iconSize={8}
                        />
                        <Bar
                            dataKey="onTrack"
                            name="On Track"
                            stackId="status"
                            fill="#22c55e"
                            radius={[0, 0, 4, 4]}
                        />
                        <Bar
                            dataKey="atRisk"
                            name="At Risk"
                            stackId="status"
                            fill="#f59e0b"
                        />
                        <Bar
                            dataKey="offTrack"
                            name="Off Track"
                            stackId="status"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
