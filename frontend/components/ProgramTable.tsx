'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { Program } from '@/lib/mockData';

interface ProgramTableProps {
    programs: Program[];
    compact?: boolean;
}

const statusColors = {
    'On Track': 'bg-green-100 text-green-700',
    'At Risk': 'bg-amber-100 text-amber-700',
    'Off Track': 'bg-red-100 text-red-700',
    'Completed': 'bg-blue-100 text-blue-700',
};

const stageProgress = {
    'Discovery': 10,
    'Planning': 30,
    'In Progress': 60,
    'Launching': 85,
    'Completed': 100,
};

const stageColors = {
    'Discovery': 'bg-gray-400',
    'Planning': 'bg-blue-400',
    'In Progress': 'bg-blue-500',
    'Launching': 'bg-amber-500',
    'Completed': 'bg-green-500',
};

export function ProgramTable({ programs, compact = false }: ProgramTableProps) {
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

    // Show fewer programs in compact mode
    const maxPrograms = compact ? 4 : 8;
    const displayedPrograms = filteredPrograms.slice(0, maxPrograms);

    const resetFilters = () => {
        setStatusFilter(null);
        setProductLineFilter(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Program Portfolio
                </h3>
                <div className="flex gap-2">
                    {(statusFilter || productLineFilter) && (
                        <button
                            onClick={resetFilters}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Reset Filters
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showFilters ? 'bg-gray-100' : ''}`}
                    >
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                            Status
                        </label>
                        <select
                            value={statusFilter || ''}
                            onChange={(e) => setStatusFilter(e.target.value || null)}
                            className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors min-w-[140px]"
                        >
                            <option value="">All Statuses</option>
                            {['On Track', 'At Risk', 'Off Track', 'Completed'].map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                            Product Line
                        </label>
                        <select
                            value={productLineFilter || ''}
                            onChange={(e) => setProductLineFilter(e.target.value || null)}
                            className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors min-w-[140px]"
                        >
                            <option value="">All Lines</option>
                            {productLines.map(line => (
                                <option key={line} value={line}>{line}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Line
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Launch
                            </th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                                Stage
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedPrograms.length > 0 ? (
                            displayedPrograms.map((program) => (
                                <tr
                                    key={program.id}
                                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-5 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{program.name}</p>
                                            <p className="text-xs text-gray-500">{program.owner} • {program.team}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[program.status as keyof typeof statusColors]}`}>
                                            {program.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-600">
                                        {program.productLine}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-600">
                                        {formatDate(program.launchDate)}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${stageColors[program.pipelineStage as keyof typeof stageColors]} rounded-full transition-all duration-300`}
                                                    style={{ width: `${stageProgress[program.pipelineStage as keyof typeof stageProgress]}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-gray-500 text-sm">
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
