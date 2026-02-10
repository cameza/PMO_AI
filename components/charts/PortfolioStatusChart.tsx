'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Program } from '@/lib/mockData';

interface StatusData {
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
  count: number;
  percentage: number;
}

interface PortfolioStatusChartProps {
  data: Program[];
  compact?: boolean;
  onSegmentClick?: (status: string) => void;
}

// Gradient ID mapping per status
const STATUS_GRADIENTS: Record<string, { id: string; from: string; to: string }> = {
  'On Track': { id: 'donutOnTrack', from: '#10b981', to: '#059669' },
  'At Risk': { id: 'donutAtRisk', from: '#f59e0b', to: '#d97706' },
  'Off Track': { id: 'donutOffTrack', from: '#f43f5e', to: '#e11d48' },
  'Completed': { id: 'donutCompleted', from: '#8b5cf6', to: '#6d28d9' },
};

const getStatusColor = (status: string) => STATUS_GRADIENTS[status]?.from ?? '#64748b';

export function PortfolioStatusChart({ data, compact = false, onSegmentClick }: PortfolioStatusChartProps) {
  // Calculate status distribution
  const statusCounts = data.reduce((acc, program) => {
    acc[program.status] = (acc[program.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = data.length;
  const statusData: StatusData[] = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as StatusData['status'],
    count,
    percentage: Math.round((count / total) * 100)
  }));

  // Custom label for pie segments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={compact ? 10 : 11}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip — shows status label, count, and percentage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const statusItem = statusData.find(s => s.status === entry.payload?.status);
      if (!statusItem) return null;
      return (
        <div className="bg-surface-light px-3 py-2 rounded-lg shadow-glass border border-white/10">
          <p className="font-semibold text-white text-sm">{statusItem.status} Items</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {statusItem.count} programs &middot; {statusItem.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-surface rounded-xl border border-white/10 flex flex-col ${compact ? 'p-3 h-full' : 'p-5'}`}>
      <h3 className={`font-semibold text-slate-400 uppercase tracking-wider ${compact ? 'text-xs mb-2' : 'text-sm mb-4'}`}>
        Portfolio Status Overview
      </h3>
      <div className={`flex-1 ${compact ? 'min-h-[180px]' : 'h-56'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {Object.values(STATUS_GRADIENTS).map((g) => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={g.from} />
                  <stop offset="100%" stopColor={g.to} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={compact ? 75 : 90}
              innerRadius={compact ? 40 : 50}
              dataKey="count"
              nameKey="status"
              stroke="rgba(10, 11, 16, 0.5)"
              strokeWidth={2}
              cursor={onSegmentClick ? 'pointer' : undefined}
              onClick={onSegmentClick ? (_: unknown, index: number) => onSegmentClick(statusData[index].status) : undefined}
            >
              {statusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${STATUS_GRADIENTS[entry.status]?.id ?? 'donutCompleted'})`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — matches Recharts Legend style from other charts */}
      <div className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? 'mt-1' : 'mt-2'} justify-center`}>
        {statusData.map((item) => (
          <div
            key={item.status}
            className={`flex items-center gap-1.5 ${onSegmentClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={onSegmentClick ? () => onSegmentClick(item.status) : undefined}
          >
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: getStatusColor(item.status) }}
            />
            <span className="text-slate-400" style={{ fontSize: compact ? '10px' : '12px' }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
