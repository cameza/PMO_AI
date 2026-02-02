'use client';

import { Bell, User } from 'lucide-react';
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

export default function Dashboard() {
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
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Portfolio</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Executive Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              JD
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Strategic Coverage"
              value={`${strategicCoverage.covered} of ${strategicCoverage.total}`}
              subtitle={`${strategicCoverage.total - strategicCoverage.covered} objectives uncovered`}
              subtitleColor="text-blue-500"
            />
            <KPICard
              title="Lines Under Pressure"
              value={`${linesUnderPressure.count} lines`}
              tags={linesUnderPressure.lines.map(line => ({
                label: line,
                color: 'bg-blue-100 text-blue-700'
              }))}
            />
            <KPICard
              title="Milestone Completion"
              value={`${milestoneCompletion.percentage}%`}
              subtitle={`${milestoneCompletion.completed} of ${milestoneCompletion.total} completed`}
              subtitleColor="text-gray-500"
              progress={milestoneCompletion.percentage}
              progressColor="bg-green-500"
            />
            <KPICard
              title="Upcoming Launches"
              value={`${upcomingLaunches.count} launching`}
              subtitle={`Next: ${formatLaunchDate(upcomingLaunches.nextDate)}`}
              subtitleColor="text-blue-500"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <ProgramVelocityChart data={velocityData} />
            <StrategicAlignmentChart data={alignmentData} />
            <LaunchCadenceChart data={cadenceData} />
            <RiskLandscapeChart data={riskData} />
          </div>

          {/* Program Table */}
          <ProgramTable programs={programs} />
        </main>
      </div>

      {/* AI Chat Sidebar */}
      <aside className="w-96 border-l border-gray-200 bg-white hidden lg:block">
        <ChatWidget />
      </aside>
    </div>
  );
}

function formatLaunchDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
