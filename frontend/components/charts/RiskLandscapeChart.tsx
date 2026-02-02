'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';

interface RiskData {
    productLine: string;
    high: number;
    medium: number;
    low: number;
}

interface RiskLandscapeChartProps {
    data: RiskData[];
    compact?: boolean;
}

export function RiskLandscapeChart({ data, compact = false }: RiskLandscapeChartProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
            <h3 className={`font-semibold text-gray-700 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Risk Landscape
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
                            dataKey="high"
                            name="High"
                            stackId="severity"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="medium"
                            name="Medium"
                            stackId="severity"
                            fill="#f59e0b"
                        />
                        <Bar
                            dataKey="low"
                            name="Low"
                            stackId="severity"
                            fill="#22c55e"
                            radius={[0, 0, 4, 4]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
