'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';

interface CadenceData {
    month: string;
    count: number;
    isCurrent: boolean;
}

interface LaunchCadenceChartProps {
    data: CadenceData[];
    compact?: boolean;
}

export function LaunchCadenceChart({ data, compact = false }: LaunchCadenceChartProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
            <h3 className={`font-semibold text-gray-700 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Launch Cadence
            </h3>
            <div className={`flex-1 ${compact ? 'min-h-[160px]' : 'h-48'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 5, left: -20, bottom: 0 }}
                        barSize={compact ? 20 : 32}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: compact ? 10 : 12, fill: '#64748b' }}
                            dy={5}
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
                            dataKey="count"
                            name="Current Month"
                            radius={[4, 4, 0, 0]}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isCurrent ? '#2563eb' : '#93c5fd'}
                                />
                            ))}
                            <LabelList
                                dataKey="count"
                                position="top"
                                style={{
                                    fontSize: compact ? 10 : 12,
                                    fontWeight: 600,
                                    fill: '#64748b'
                                }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
