'use client';

import { X, CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import type { Program } from '@/lib/mockData';

interface MilestoneCompletionDetailProps {
  isOpen: boolean;
  onClose: () => void;
  programs: Program[];
  completed: number;
  total: number;
  percentage: number;
  onProgramClick?: (programId: string) => void;
}

interface MilestoneWithProgram {
  id: string;
  name: string;
  dueDate: string;
  completedDate: string | null;
  status: string;
  programId: string;
  programName: string;
}

export function MilestoneCompletionDetail({ isOpen, onClose, programs, completed, total, percentage, onProgramClick }: MilestoneCompletionDetailProps) {
  if (!isOpen) return null;

  // Get current month milestones with program context
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const milestones: MilestoneWithProgram[] = programs.flatMap(p =>
    p.milestones
      .filter(m => m.dueDate?.startsWith(currentMonth))
      .map(m => ({
        id: m.id,
        name: m.name,
        dueDate: m.dueDate,
        completedDate: m.completedDate,
        status: m.status,
        programId: p.id,
        programName: p.name,
      }))
  );

  const completedMilestones = milestones.filter(m => m.status === 'Completed');
  const pendingMilestones = milestones.filter(m => m.status !== 'Completed');

  const statusIcon: Record<string, JSX.Element> = {
    'Completed': <CheckCircle2 className="w-4 h-4 text-accent-emerald" />,
    'Pending': <Clock className="w-4 h-4 text-slate-400" />,
    'In Progress': <Clock className="w-4 h-4 text-accent-violet" />,
    'At Risk': <AlertTriangle className="w-4 h-4 text-accent-amber" />,
    'Overdue': <AlertCircle className="w-4 h-4 text-accent-rose" />,
  };

  const statusColor: Record<string, string> = {
    'Completed': 'bg-accent-emerald/20 text-accent-emerald',
    'Pending': 'bg-slate-500/20 text-slate-400',
    'In Progress': 'bg-accent-violet/20 text-accent-violet',
    'At Risk': 'bg-accent-amber/20 text-accent-amber',
    'Overdue': 'bg-accent-rose/20 text-accent-rose',
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Milestone Completion</h2>
            <p className="text-slate-400 mt-1">
              {completed} of {total} milestones completed this month ({percentage}%)
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-accent-emerald rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pending / At Risk / Overdue */}
          {pendingMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                Remaining ({pendingMilestones.length})
              </h3>
              <div className="space-y-2">
                {pendingMilestones.map(m => (
                  <div
                    key={m.id}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => onProgramClick?.(m.programId)}
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon[m.status] || <Clock className="w-4 h-4 text-slate-400" />}
                      <div>
                        <p className="font-medium text-white">{m.name}</p>
                        <p className="text-sm text-slate-400">{m.programName} • Due {formatDate(m.dueDate)}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColor[m.status] || statusColor['Pending']}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedMilestones.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                Completed ({completedMilestones.length})
              </h3>
              <div className="space-y-2">
                {completedMilestones.map(m => (
                  <div
                    key={m.id}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => onProgramClick?.(m.programId)}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
                      <div>
                        <p className="font-medium text-slate-300">{m.name}</p>
                        <p className="text-sm text-slate-500">{m.programName} • Completed {m.completedDate ? formatDate(m.completedDate) : formatDate(m.dueDate)}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-accent-emerald/20 text-accent-emerald">
                      Done
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {milestones.length === 0 && (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <p className="text-slate-400">No milestones due this month</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
