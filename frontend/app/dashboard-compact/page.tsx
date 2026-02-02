'use client';

import Link from 'next/link';
import { Bell, LayoutGrid, Rows3 } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ProgramVelocityChart } from '@/components/charts/ProgramVelocityChart';
import { StrategicAlignmentChart } from '@/components/charts/StrategicAlignmentChart';
import { LaunchCadenceChart } from '@/components/charts/LaunchCadenceChart';
import { RiskLandscapeChart } from '@/components/charts/RiskLandscapeChart';
import { ProgramTable } from '@/components/ProgramTable';
import { ChatWidget } from '@/components/ChatWidget';
import {
    programs,
    getVelocityData,
    getStrategicAlignmentData,
    getLaunchCadenceData,
    getRiskLandscapeData,
    getStrategicCoverage,
    getLinesUnderPressure,
    getMilestoneCompletion,
    getUpcomingLaunches,
} from '@/lib/mockData';

export default function DashboardCompact() {
    // Compute KPI data
    const strategicCoverage = getStrategicCoverage();
    const linesUnderPressure = getLinesUnderPressure();
    const milestoneCompletion = getMilestoneCompletion();
    const upcomingLaunches = getUpcomingLaunches();

    // Compute chart data
    const velocityData = getVelocityData();
    const alignmentData = getStrategicAlignmentData();
    const cadenceData = getLaunchCadenceData();
    const riskData = getRiskLandscapeData();

    return (
        <div className="h-screen bg-[#f8fafc] flex overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-sm">P</span>
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900 text-sm">Portfolio</h1>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Executive Dashboard</p>
                        </div>
                    </div>

                    {/* Layout Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <Link
                            href="/"
                            className="p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                            title="Standard Layout"
                        >
                            <Rows3 className="w-4 h-4" />
                        </Link>
                        <div className="p-1.5 rounded bg-white shadow-sm text-blue-600">
                            <LayoutGrid className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                            <Bell className="w-5 h-5 text-gray-500" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            JD
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-4 flex flex-col min-h-0 gap-3 overflow-y-auto md:overflow-hidden w-full max-w-[100vw]">
                    {/* KPI Cards Row */}
                    {/* Mobile: Swipe Carousel, Desktop: Grid */}
                    <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-3 pb-2 md:pb-0 md:grid md:grid-cols-4 flex-shrink-0 no-scrollbar">
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <KPICard
                                title="Strategic Coverage"
                                value={`${strategicCoverage.covered} of ${strategicCoverage.total}`}
                                subtitle={`${strategicCoverage.total - strategicCoverage.covered} objectives uncovered`}
                                subtitleColor="text-blue-500"
                            />
                        </div>
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <KPICard
                                title="Lines Under Pressure"
                                value={`${linesUnderPressure.count} lines`}
                                tags={linesUnderPressure.lines.map(line => ({
                                    label: line,
                                    color: 'bg-blue-100 text-blue-700'
                                }))}
                            />
                        </div>
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <KPICard
                                title="Milestone Completion"
                                value={`${milestoneCompletion.percentage}%`}
                                subtitle={`${milestoneCompletion.completed} of ${milestoneCompletion.total} completed`}
                                subtitleColor="text-gray-500"
                                progress={milestoneCompletion.percentage}
                                progressColor="bg-green-500"
                            />
                        </div>
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <KPICard
                                title="Upcoming Launches"
                                value={`${upcomingLaunches.count} launching`}
                                subtitle={`Next: ${formatLaunchDate(upcomingLaunches.nextDate)}`}
                                subtitleColor="text-blue-500"
                            />
                        </div>
                    </div>

                    {/* Charts Row */}
                    {/* Mobile: Swipe Carousel, Desktop: Grid */}
                    <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-3 pb-2 md:pb-0 md:grid md:grid-cols-4 flex-shrink-0 no-scrollbar">
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <ProgramVelocityChart data={velocityData} compact />
                        </div>
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <StrategicAlignmentChart data={alignmentData} compact />
                        </div>
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <LaunchCadenceChart data={cadenceData} compact />
                        </div>
                        <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
                            <RiskLandscapeChart data={riskData} compact />
                        </div>
                    </div>

                    {/* Program Table - Takes remaining space */}
                    <div className="flex-1 min-h-[300px] md:min-h-0 overflow-hidden">
                        <ProgramTable programs={programs} compact />
                    </div>
                </main>
            </div>

            {/* AI Chat Sidebar - Fixed to viewport */}
            <aside className="w-80 border-l border-gray-200 bg-white hidden lg:flex flex-col h-screen">
                <ChatWidget />
            </aside>
        </div>
    );
}

function formatLaunchDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
