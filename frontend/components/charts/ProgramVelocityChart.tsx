'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface VelocityData {
    stage: string;
    count: number;
}

interface ProgramVelocityChartProps {
    data: VelocityData[];
    compact?: boolean;
}

export function ProgramVelocityChart({ data, compact = false }: ProgramVelocityChartProps) {
    // Gradient colors for the pipeline stages
    const getBarColor = (index: number) => {
        const colors = [
            '#3b82f6', // Discovery - Blue
            '#2563eb', // Planning - Darker Blue  
            '#1d4ed8', // In Progress - Even Darker
            '#1e40af', // Launching - Dark Blue
            '#1e3a8a', // Completed - Darkest Blue
        ];
        return colors[index] || colors[0];
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
            <h3 className={`font-semibold text-gray-700 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
                Program Velocity
            </h3>
            <div className={`flex-1 ${compact ? 'min-h-[160px]' : 'h-48'}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 40, left: compact ? 0 : 80, bottom: 5 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="stage"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: compact ? 10 : 12, fill: '#64748b' }}
                            width={compact ? 65 : 75}
                        />
                        <Bar
                            dataKey="count"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                            ))}
                            <LabelList
                                dataKey="count"
                                position="right"
                                style={{ fontSize: 12, fontWeight: 600, fill: '#3b82f6' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
