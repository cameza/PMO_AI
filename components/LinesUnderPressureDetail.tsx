'use client';

import { X, AlertTriangle } from 'lucide-react';
import type { Program } from '@/lib/mockData';

interface LinesUnderPressureDetailProps {
  isOpen: boolean;
  onClose: () => void;
  programs: Program[];
  onProgramClick?: (programId: string) => void;
}

export function LinesUnderPressureDetail({ isOpen, onClose, programs, onProgramClick }: LinesUnderPressureDetailProps) {
  if (!isOpen) return null;

  // Group programs by product line, only At Risk / Off Track
  const flaggedPrograms = programs.filter(p => p.status === 'At Risk' || p.status === 'Off Track');
  const byLine: Record<string, Program[]> = {};
  flaggedPrograms.forEach(p => {
    byLine[p.productLine] = byLine[p.productLine] || [];
    byLine[p.productLine].push(p);
  });

  // Lines under pressure = 2+ flagged programs
  const pressureLines = Object.entries(byLine).filter(([, progs]) => progs.length >= 2);
  const otherLines = Object.entries(byLine).filter(([, progs]) => progs.length < 2);

  const statusColors: Record<string, string> = {
    'At Risk': 'bg-accent-amber/20 text-accent-amber',
    'Off Track': 'bg-accent-rose/20 text-accent-rose',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Product Lines Under Pressure</h2>
            <p className="text-slate-400 mt-1">
              {pressureLines.length} product line{pressureLines.length !== 1 ? 's' : ''} with 2+ at-risk or off-track programs
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pressure Lines */}
          {pressureLines.map(([line, progs]) => (
            <div key={line} className="bg-surface rounded-xl border border-accent-rose/20 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent-rose/20 text-accent-rose">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{line}</h3>
                  <p className="text-sm text-slate-400">{progs.length} programs flagged</p>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-accent-rose/20 text-accent-rose">
                  Under Pressure
                </span>
              </div>
              <div className="space-y-2">
                {progs.map(p => (
                  <div
                    key={p.id}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => onProgramClick?.(p.id)}
                  >
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-sm text-slate-400">{p.owner} • {p.pipelineStage}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Other flagged lines (< 2 programs) */}
          {otherLines.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Other Flagged Programs</h3>
              <div className="space-y-2">
                {otherLines.flatMap(([, progs]) => progs).map(p => (
                  <div
                    key={p.id}
                    className="bg-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => onProgramClick?.(p.id)}
                  >
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-sm text-slate-400">{p.productLine} • {p.owner}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {flaggedPrograms.length === 0 && (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <p className="text-slate-400">No programs are currently at risk or off track</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
