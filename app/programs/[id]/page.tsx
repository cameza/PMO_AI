'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    AlertCircle,
    Info,
    ChevronRight,
} from 'lucide-react';
import { fetchProgram, fetchStrategicObjectives, type StrategicObjective } from '@/lib/api';
import { ChatWidget } from '@/components/ChatWidget';
import type { Program, Risk, Milestone } from '@/lib/mockData';

const statusColors = {
    'On Track': 'bg-accent-emerald/20 text-accent-emerald',
    'At Risk': 'bg-accent-amber/20 text-accent-amber',
    'Off Track': 'bg-accent-rose/20 text-accent-rose',
    'Completed': 'bg-slate-500/20 text-slate-400',
};

const riskSeverityColors = {
    'High': 'text-accent-rose bg-accent-rose/10',
    'Medium': 'text-accent-amber bg-accent-amber/10',
    'Low': 'text-blue-400 bg-blue-400/10',
};

export default function ProgramDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [program, setProgram] = useState<Program | null>(null);
    const [strategicObjectives, setStrategicObjectives] = useState<StrategicObjective[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProgram() {
            if (!id) return;
            try {
                setIsLoading(true);
                const [programData, objectivesData] = await Promise.all([
                    fetchProgram(id as string),
                    fetchStrategicObjectives()
                ]);
                setProgram(programData);
                setStrategicObjectives(objectivesData);
            } catch (err) {
                console.error('Error fetching program:', err);
                setError('Failed to load program details.');
            } finally {
                setIsLoading(false);
            }
        }
        loadProgram();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-deep flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium">Loading program details...</p>
                </div>
            </div>
        );
    }

    if (error || !program) {
        return (
            <div className="min-h-screen bg-deep flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-surface rounded-2xl shadow-glass border border-white/10 p-8 text-center text-sm">
                    <div className="w-12 h-12 bg-accent-rose/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-accent-rose" />
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">Error</h2>
                    <p className="text-slate-400 mb-6">{error || 'Program not found'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-accent-violet text-white font-semibold py-2.5 rounded-xl hover:bg-accent-violet/80 transition-colors shadow-sm"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-deep flex flex-col font-jakarta">
            {/* Nav Header */}
            <header className="bg-surface/80 backdrop-blur-md border-b border-white/10 px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-white/10">
                            {program.owner.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight tracking-tight">{program.name}</h1>
                            <p className="text-sm text-slate-500 font-medium">{program.owner} • Program Owner</p>
                        </div>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[program.status as keyof typeof statusColors]}`}>
                    {program.status}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Areas */}
                <main className="flex-1 overflow-y-auto p-8 lg:p-10 scrollbar-hide bg-deep">
                    <div className="max-w-4xl mx-auto space-y-10">

                        {/* Overview Section */}
                        <section className="bg-surface rounded-2xl border border-white/10 p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Stage: {program.pipelineStage}
                                </span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Overview</h2>
                            <p className="text-slate-300 leading-relaxed text-lg mb-6">
                                {program.description}
                            </p>

                            <div className="bg-accent-violet/10 rounded-xl p-4 border border-accent-violet/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-accent-violet" />
                                    <span className="text-xs font-bold text-accent-violet uppercase tracking-wide">Latest Update</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                    {program.lastUpdate}
                                </p>
                            </div>

                            {/* Strategic Objectives */}
                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Strategic Objectives</h3>
                                <div className="space-y-3">
                                    {program.strategicObjectives.length > 0 ? (
                                        program.strategicObjectives.map((objName) => {
                                            const objective = strategicObjectives.find(o => o.name === objName);
                                            return (
                                                <div key={objName} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-white">{objName}</p>
                                                            {objective && (
                                                                <p className="text-xs text-slate-400 mt-1">
                                                                    {objective.priority === 1 ? 'High' : objective.priority === 2 ? 'Medium' : 'Low'} Priority
                                                                    {objective.owner && ` • ${objective.owner}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="px-2 py-1 bg-accent-violet/20 text-accent-violet rounded text-xs font-medium">
                                                            Mapped
                                                        </div>
                                                    </div>
                                                    {objective?.description && (
                                                        <p className="text-sm text-slate-400 mt-2">{objective.description}</p>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                                            <p className="text-slate-400">No strategic objectives mapped to this program</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Consider mapping objectives to show strategic impact
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Risks Section */}
                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-accent-rose pl-3">Active Risks</h2>
                                <button className="text-xs font-bold text-accent-violet hover:text-accent-violet/80 transition-colors flex items-center gap-1 group">
                                    View All ({program.risks.length})
                                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {program.risks.length > 0 ? (
                                    program.risks.slice(0, 4).map((risk) => (
                                        <RiskCard key={risk.id} risk={risk} />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No active risks identified.</p>
                                )}
                            </div>
                        </section>

                        {/* Milestones Section */}
                        <section>
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-accent-violet pl-3 mb-8">Project Milestones</h2>
                            <div className="bg-surface rounded-2xl border border-white/10 p-8">
                                <MilestoneTimeline milestones={program.milestones} />
                            </div>
                        </section>
                    </div>
                </main>

                {/* AI Assistant Sidebar */}
                <aside className="w-[380px] h-[calc(100vh-8rem)] sticky top-28 m-4 ml-0 glass border border-white/10 rounded-2xl hidden xl:flex flex-col shadow-2xl relative overflow-hidden">
                    <ChatWidget programContext={program.id} />
                </aside>
            </div>
        </div>
    );
}

function RiskCard({ risk }: { risk: Risk }) {
    return (
        <div className="bg-surface rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all cursor-pointer flex justify-between items-start gap-4">
            <div className="flex gap-4">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${risk.severity === 'High' ? 'bg-accent-rose' :
                    risk.severity === 'Medium' ? 'bg-accent-amber' : 'bg-blue-400'
                    }`} />
                <div>
                    <h4 className="font-semibold text-white text-sm mb-1">{risk.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{risk.description}</p>
                </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${riskSeverityColors[risk.severity as keyof typeof riskSeverityColors]}`}>
                {risk.severity.substring(0, 3)}
            </span>
        </div>
    );
}

function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
    // Sort milestones by date roughly for display
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
        <div className="relative pl-8 space-y-12">
            {/* Line joining nodes */}
            <div className="absolute left-[39px] top-2 bottom-2 w-0.5 bg-white/10" />

            {sortedMilestones.map((m, idx) => {
                const isCompleted = m.status === 'Completed';
                const isCurrent = m.status === 'Upcoming' && (idx === 0 || sortedMilestones[idx - 1].status === 'Completed');

                return (
                    <div key={m.id} className="relative flex items-start">
                        {/* Node */}
                        <div className="absolute -left-8 top-0 flex items-center justify-center">
                            {isCompleted ? (
                                <div className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-surface relative z-10">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            ) : isCurrent ? (
                                <div className="w-6 h-6 bg-surface border-4 border-accent-violet rounded-full shadow-sm relative z-10">
                                    <div className="absolute inset-0 rounded-full border-2 border-accent-violet/30 animate-ping opacity-75" />
                                </div>
                            ) : (
                                <div className="w-6 h-6 bg-surface border-2 border-white/20 rounded-full shadow-sm relative z-10" />
                            )}
                        </div>

                        <div className="ml-2">
                            <h4 className={`font-bold text-sm ${isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                                {m.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                                {isCompleted ? `Completed ${m.completedDate || m.dueDate}` : `Due ${m.dueDate}`}
                                {isCurrent && <span className="ml-2 px-1.5 py-0.5 bg-accent-violet/20 text-accent-violet rounded font-bold uppercase text-[9px]">In Progress</span>}
                            </p>

                            {isCurrent && (
                                <div className="mt-4 flex gap-3">
                                    <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-violet" />
                                        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-tight">Design Review</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                                        <Circle className="w-3.5 h-3.5 text-slate-600" />
                                        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-tight">API Spec</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

