'use client';

import { X, Rocket } from 'lucide-react';
import type { Program } from '@/lib/mockData';

interface UpcomingLaunchesDetailProps {
  isOpen: boolean;
  onClose: () => void;
  programs: Program[];
  onProgramClick?: (programId: string) => void;
}

export function UpcomingLaunchesDetail({ isOpen, onClose, programs, onProgramClick }: UpcomingLaunchesDetailProps) {
  if (!isOpen) return null;

  const now = new Date();
  const thirtyDaysOut = new Date(now);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  const launching = programs
    .filter(p => {
      const d = new Date(p.launchDate);
      return d >= now && d <= thirtyDaysOut && p.status !== 'Completed';
    })
    .sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime());

  const statusColors: Record<string, string> = {
    'On Track': 'bg-accent-emerald/20 text-accent-emerald',
    'At Risk': 'bg-accent-amber/20 text-accent-amber',
    'Off Track': 'bg-accent-rose/20 text-accent-rose',
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Upcoming Launches</h2>
            <p className="text-slate-400 mt-1">
              {launching.length} program{launching.length !== 1 ? 's' : ''} launching in the next 30 days
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {launching.map((p) => (
            <div
              key={p.id}
              className="bg-white/5 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors border border-white/5"
              onClick={() => onProgramClick?.(p.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-accent-violet">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-sm text-slate-400">
                    {p.productLine} • {p.owner} • {formatDate(p.launchDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">{daysUntil(p.launchDate)}</span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[p.status] || 'bg-slate-500/20 text-slate-400'}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}

          {launching.length === 0 && (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <p className="text-slate-400">No programs launching in the next 30 days</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
