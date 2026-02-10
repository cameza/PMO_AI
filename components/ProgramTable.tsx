'use client';

import { useState } from 'react';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Program } from '@/lib/mockData';

interface ProgramTableProps {
    programs: Program[];
    compact?: boolean;
    onCreateProgram?: () => void;
    dataSource?: 'manual' | 'synced';
}

const statusColors = {
    'On Track': 'bg-accent-emerald/20 text-accent-emerald',
    'At Risk': 'bg-accent-amber/20 text-accent-amber',
    'Off Track': 'bg-accent-rose/20 text-accent-rose',
    'Completed': 'bg-slate-500/20 text-slate-400',
};

const stageProgress = {
    'Discovery': 10,
    'Planning': 30,
    'In Progress': 60,
    'Launching': 85,
    'Completed': 100,
};

const stageColors = {
    'Discovery': '#8b5cf6',
    'Planning': '#7c3aed',
    'In Progress': '#6d28d9',
    'Launching': '#5b21b6',
    'Completed': '#4c1d95',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProgramTable({ programs, compact = false, onCreateProgram, dataSource = 'manual' }: ProgramTableProps) {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [productLineFilter, setProductLineFilter] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Get unique product lines from programs
    const productLines = Array.from(new Set(programs.map(p => p.productLine))).sort();

    const filteredPrograms = programs.filter(p => {
        const matchesStatus = !statusFilter || p.status === statusFilter;
        const matchesProductLine = !productLineFilter || p.productLine === productLineFilter;
        return matchesStatus && matchesProductLine;
    });

    const displayedPrograms = filteredPrograms;

    const resetFilters = () => {
        setStatusFilter(null);
        setProductLineFilter(null);
    };

    const handleRowClick = (id: string) => {
        router.push(`/programs/${id}`);
    };

    return (
        <div className="bg-surface rounded-xl border border-white/10 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center flex-shrink-0 bg-surface z-20">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    Program Portfolio
                </h3>
                <div className="flex gap-2 items-center">
                    {(statusFilter || productLineFilter) && (
                        <button
                            onClick={resetFilters}
                            className="text-xs text-accent-violet hover:text-accent-violet/80 font-medium"
                        >
                            Reset Filters
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${showFilters ? 'bg-white/5' : ''}`}
                    >
                        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                    </button>
                    {dataSource === 'manual' && onCreateProgram && (
                        <button
                            onClick={onCreateProgram}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent-violet rounded-lg hover:bg-accent-violet/80 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Program
                        </button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="px-5 py-4 border-b border-white/5 bg-surface-light/50 flex flex-wrap gap-4 items-end flex-shrink-0 z-20">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                            Status
                        </label>
                        <select
                            value={statusFilter || ''}
                            onChange={(e) => setStatusFilter(e.target.value || null)}
                            className="text-xs bg-surface-lighter border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-accent-violet transition-colors min-w-[140px] text-slate-300"
                        >
                            <option value="">All Statuses</option>
                            {['On Track', 'At Risk', 'Off Track', 'Completed'].map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                            Product Line
                        </label>
                        <select
                            value={productLineFilter || ''}
                            onChange={(e) => setProductLineFilter(e.target.value || null)}
                            className="text-xs bg-surface-lighter border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-accent-violet transition-colors min-w-[140px] text-slate-300"
                        >
                            <option value="">All Lines</option>
                            {productLines.map(line => (
                                <option key={line} value={line}>{line}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto min-h-0 relative">
                <table className="w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-surface">
                        <tr className="border-b border-white/5">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-surface border-b border-white/5">
                                Name
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-surface border-b border-white/5">
                                Status
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-surface border-b border-white/5">
                                Line
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-surface border-b border-white/5">
                                Launch
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 bg-surface border-b border-white/5">
                                Stage
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedPrograms.length > 0 ? (
                            displayedPrograms.map((program) => (
                                <tr
                                    key={program.id}
                                    onClick={() => handleRowClick(program.id)}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <td className="px-5 py-4">
                                        <div>
                                            <p className="font-medium text-white">{program.name}</p>
                                            <p className="text-xs text-slate-500">{program.owner} • {program.team}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[program.status as keyof typeof statusColors]}`}>
                                            {program.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-400">
                                        {program.productLine}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-400">
                                        {formatDate(program.launchDate)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${stageProgress[program.pipelineStage as keyof typeof stageProgress]}%`,
                                                        backgroundColor: stageColors[program.pipelineStage as keyof typeof stageColors]
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">
                                    No programs found matching the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date('2026-02-01');

    if (date < now) {
        return 'Overdue';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
