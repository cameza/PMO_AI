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
import { useState, useEffect, useMemo } from 'react';
import { fetchPrograms } from '@/lib/api';
import type { Program } from '@/lib/mockData';
import {
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
  const [fetchedPrograms, setFetchedPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await fetchPrograms();
        setFetchedPrograms(data);
        setError(null);
      } catch (err) {
        console.error('Error loading programs:', err);
        setError('Failed to load portfolio data. Please ensure the backend is running.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute KPI data
  const strategicCoverage = useMemo(() => getStrategicCoverage(fetchedPrograms), [fetchedPrograms]);
  const linesUnderPressure = useMemo(() => getLinesUnderPressure(fetchedPrograms), [fetchedPrograms]);
  const milestoneCompletion = useMemo(() => getMilestoneCompletion(fetchedPrograms), [fetchedPrograms]);
  const upcomingLaunches = useMemo(() => getUpcomingLaunches(fetchedPrograms), [fetchedPrograms]);

  // Compute chart data
  const velocityData = useMemo(() => getVelocityData(fetchedPrograms), [fetchedPrograms]);
  const alignmentData = useMemo(() => getStrategicAlignmentData(fetchedPrograms), [fetchedPrograms]);
  const riskData = useMemo(() => getRiskLandscapeData(fetchedPrograms), [fetchedPrograms]);

  // Launch Cadence uses simulated months for now
  const cadenceData = getLaunchCadenceData();

  if (isLoading) {
    return (
      <div className="h-screen bg-[#f8fafc] flex items-center justify-center font-inter">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#f8fafc] flex items-center justify-center font-inter p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center text-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

          {/* Layout Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <div className="p-1.5 rounded bg-white shadow-sm text-blue-600">
              <Rows3 className="w-4 h-4" />
            </div>
            <Link
              href="/dashboard-compact"
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
              title="Compact Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </Link>
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
          <ProgramTable programs={fetchedPrograms} />
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
