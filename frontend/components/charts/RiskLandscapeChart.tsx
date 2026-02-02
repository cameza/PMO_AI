'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

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
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${compact ? 'p-3' : 'p-5'}`}>
            <h3 className={`font-semibold text-gray-700 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Risk Landscape
            </h3>
            <div className={compact ? 'h-40' : 'h-40'}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                        <XAxis
                            dataKey="productLine"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Bar
                            dataKey="high"
                            name="High"
                            stackId="severity"
                            fill="#ef4444"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="medium"
                            name="Medium"
                            stackId="severity"
                            fill="#f59e0b"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="low"
                            name="Low"
                            stackId="severity"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-xs text-gray-500">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-xs text-gray-500">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                    <span className="text-xs text-gray-500">Low</span>
                </div>
            </div>
        </div>
    );
}
