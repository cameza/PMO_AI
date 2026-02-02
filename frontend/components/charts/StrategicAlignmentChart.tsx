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
}

export function StrategicAlignmentChart({ data, compact = false }: StrategicAlignmentChartProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${compact ? 'p-3' : 'p-5'}`}>
            <h3 className={`font-semibold text-gray-700 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Strategic Alignment
            </h3>
            <div className={compact ? 'h-24' : 'h-48'}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
                    >
                        <XAxis
                            dataKey="productLine"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            interval={0}
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
                            dataKey="onTrack"
                            name="On Track"
                            stackId="status"
                            fill="#22c55e"
                            radius={[0, 0, 0, 0]}
                        />
                        <Bar
                            dataKey="atRisk"
                            name="At Risk"
                            stackId="status"
                            fill="#f59e0b"
                            radius={[0, 0, 0, 0]}
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
            <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                    <span className="text-xs text-gray-500">On Track</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-amber-500" />
                    <span className="text-xs text-gray-500">At Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-xs text-gray-500">Off Track</span>
                </div>
            </div>
        </div>
    );
}
