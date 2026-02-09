'use client';

import { Bell } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ProgramVelocityChart } from '@/components/charts/ProgramVelocityChart';
import { StrategicAlignmentChart } from '@/components/charts/StrategicAlignmentChart';
import { LaunchCadenceChart } from '@/components/charts/LaunchCadenceChart';
import { PortfolioStatusChart } from '@/components/charts/PortfolioStatusChart';
import { ProgramTable } from '@/components/ProgramTable';
import { ChatWidget } from '@/components/ChatWidget';
import { StrategicCoverageDetail } from '@/components/StrategicCoverageDetail';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPrograms } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Program } from '@/lib/mockData';
import {
  getVelocityData,
  getStrategicAlignmentData,
  getLaunchCadenceData,
  getStrategicCoverage,
  getLinesUnderPressure,
  getMilestoneCompletion,
  getUpcomingLaunches,
} from '@/lib/mockData';

export default function Dashboard() {
  const [fetchedPrograms, setFetchedPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStrategicDetailOpen, setIsStrategicDetailOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

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

  // Launch Cadence uses actual program data for dynamic calculation
  const cadenceData = useMemo(() => getLaunchCadenceData(fetchedPrograms), [fetchedPrograms]);

  if (isLoading) {
    return (
      <div className="h-screen bg-deep flex items-center justify-center font-jakarta">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-deep flex items-center justify-center font-jakarta p-6">
        <div className="max-w-md w-full bg-surface rounded-2xl shadow-glass border border-white/10 p-8 text-center text-sm">
          <div className="w-12 h-12 bg-accent-rose/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-6 h-6 text-accent-rose" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-accent-violet text-white font-semibold py-2.5 rounded-xl hover:bg-accent-violet/80 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-deep flex flex-col">
      {/* Header — full width */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <h1 className="font-semibold text-white text-sm tracking-tight">Portfolio</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Executive Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-rose rounded-full" />
          </button>
          {user && (
            <span className="text-xs text-slate-400 hidden sm:block">{user.email}</span>
          )}
          <button
            onClick={async () => { await signOut(); router.push('/auth'); }}
            className="w-8 h-8 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:opacity-80 transition-opacity"
            title="Sign out"
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      {/* Body — main content + chat sidebar, both start below header */}
      <div className="flex-1 flex min-h-0">
        {/* Main Content */}
        <main className="flex-1 p-4 flex flex-col min-h-0 gap-3 w-full max-w-[100vw] overflow-y-auto">
          {/* KPI Cards Row */}
          {/* Mobile: Swipe Carousel, Desktop: Grid */}
          <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-3 pb-2 md:pb-0 md:grid md:grid-cols-4 flex-shrink-0 no-scrollbar">
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <KPICard
                title="Strategic Coverage"
                value={`${strategicCoverage.covered} of ${strategicCoverage.total}`}
                subtitle={`${strategicCoverage.total - strategicCoverage.covered} objectives uncovered`}
                subtitleColor="text-accent-violet"
                glowColor="violet"
                onClick={() => setIsStrategicDetailOpen(true)}
                className="cursor-pointer hover:border-white/30 transition-colors"
              />
            </div>
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <KPICard
                title="Lines Under Pressure"
                value={`${linesUnderPressure.count} lines`}
                tags={linesUnderPressure.lines.map(line => ({
                  label: line,
                  color: 'bg-accent-amber/20 text-accent-amber'
                }))}
                glowColor="amber"
              />
            </div>
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <KPICard
                title="Milestone Completion"
                value={`${milestoneCompletion.percentage}%`}
                subtitle={`${milestoneCompletion.completed} of ${milestoneCompletion.total} completed`}
                subtitleColor="text-slate-400"
                progress={milestoneCompletion.percentage}
                progressColor="bg-accent-emerald"
                glowColor="emerald"
              />
            </div>
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <KPICard
                title="Upcoming Launches"
                value={`${upcomingLaunches.count} launching`}
                subtitle={`Next: ${formatLaunchDate(upcomingLaunches.nextDate)}`}
                subtitleColor="text-accent-violet"
                glowColor="blue"
              />
            </div>
          </div>

          {/* Charts Row */}
          {/* Mobile: Swipe Carousel, Desktop: Grid */}
          <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-3 pb-2 md:pb-0 md:grid md:grid-cols-4 flex-shrink-0 no-scrollbar">
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <PortfolioStatusChart data={fetchedPrograms} compact />
            </div>
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <ProgramVelocityChart data={velocityData} compact />
            </div>
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <StrategicAlignmentChart data={alignmentData} compact />
            </div>
            <div className="min-w-[85vw] md:min-w-0 snap-center flex-shrink-0 block">
              <LaunchCadenceChart data={cadenceData} compact />
            </div>
          </div>

          {/* Program Table - Takes remaining space */}
          <div className="flex-1 min-h-[300px] md:min-h-0 flex flex-col">
            <ProgramTable programs={fetchedPrograms} compact />
          </div>
        </main>

        {/* AI Chat Sidebar - Floating, starts at same height as KPI cards */}
        <aside className="w-[380px] flex-shrink-0 p-4 pl-0 hidden lg:block">
          <div className="h-full glass border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <ChatWidget />
          </div>
        </aside>
      </div>

      {/* Strategic Coverage Detail Modal */}
      <StrategicCoverageDetail
        isOpen={isStrategicDetailOpen}
        onClose={() => setIsStrategicDetailOpen(false)}
        covered={strategicCoverage.covered}
        total={strategicCoverage.total}
        uncovered={strategicCoverage.uncovered}
      />
    </div>
  );
}

function formatLaunchDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
