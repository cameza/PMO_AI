'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface CadenceData {
    month: string;
    count: number;
    isCurrent: boolean;
}

interface LaunchCadenceChartProps {
    data: CadenceData[];
}

export function LaunchCadenceChart({ data }: LaunchCadenceChartProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                Launch Cadence
            </h3>
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis hide />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isCurrent ? '#2563eb' : '#93c5fd'}
                                    stroke={entry.isCurrent ? '#1d4ed8' : 'transparent'}
                                    strokeWidth={entry.isCurrent ? 2 : 0}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-600 border-2 border-blue-700" />
                    <span className="text-xs text-gray-500">Current Month</span>
                </div>
            </div>
        </div>
    );
}
