'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchStrategicObjectives, fetchPrograms, type StrategicObjective } from '@/lib/api';
import type { Program } from '@/lib/mockData';

interface StrategicCoverageDetailProps {
  isOpen: boolean;
  onClose: () => void;
  covered: number;
  total: number;
  uncovered: string[];
}

export function StrategicCoverageDetail({ 
  isOpen, 
  onClose, 
  covered, 
  total, 
  uncovered 
}: StrategicCoverageDetailProps) {
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [objectivesData, programsData] = await Promise.all([
        fetchStrategicObjectives(),
        fetchPrograms()
      ]);
      
      setObjectives(objectivesData);
      setPrograms(programsData.filter(p => p.status !== 'Completed'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgramsForObjective = (objectiveName: string): Program[] => {
    return programs.filter(program => 
      program.strategicObjectives.includes(objectiveName)
    );
  };

  const isObjectiveCovered = (objectiveName: string): boolean => {
    return !uncovered.includes(objectiveName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Strategic Coverage Details</h2>
            <p className="text-slate-400 mt-1">
              {covered} of {total} objectives covered by active programs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-violet"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-3 pb-4 border-b border-white/10">
                <a
                  href="/admin/strategic-objectives"
                  className="flex items-center gap-2 bg-accent-violet text-white px-4 py-2 rounded-lg hover:bg-accent-violet/80 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage Objectives
                </a>
                <a
                  href="/admin/strategic-objectives"
                  className="flex items-center gap-2 bg-surface border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Objective
                </a>
              </div>

              {/* Objectives List */}
              <div className="space-y-4">
                {objectives.map((objective) => {
                  const covered = isObjectiveCovered(objective.name);
                  const relatedPrograms = getProgramsForObjective(objective.name);
                  
                  return (
                    <div
                      key={objective.id}
                      className={`bg-surface rounded-xl border p-4 ${
                        covered 
                          ? 'border-accent-emerald/20' 
                          : 'border-accent-rose/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            covered 
                              ? 'bg-accent-emerald/20 text-accent-emerald' 
                              : 'bg-accent-rose/20 text-accent-rose'
                          }`}>
                            {covered ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{objective.name}</h3>
                            <p className="text-sm text-slate-400">
                              {objective.priority === 1 ? 'High' : objective.priority === 2 ? 'Medium' : 'Low'} Priority
                              {objective.owner && ` • ${objective.owner}`}
                            </p>
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          covered 
                            ? 'bg-accent-emerald/20 text-accent-emerald' 
                            : 'bg-accent-rose/20 text-accent-rose'
                        }`}>
                          {covered ? 'Covered' : 'Uncovered'}
                        </span>
                      </div>

                      {objective.description && (
                        <p className="text-slate-300 mb-3">{objective.description}</p>
                      )}

                      <div>
                        <p className="text-sm font-medium text-slate-400 mb-2">
                          Related Programs ({relatedPrograms.length})
                        </p>
                        {relatedPrograms.length > 0 ? (
                          <div className="space-y-2">
                            {relatedPrograms.map((program) => (
                              <div
                                key={program.id}
                                className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-medium text-white">{program.name}</p>
                                  <p className="text-sm text-slate-400">
                                    {program.productLine} • {program.status}
                                  </p>
                                </div>
                                <a
                                  href={`/programs/${program.id}`}
                                  className="text-accent-violet hover:text-accent-violet/80 text-sm"
                                >
                                  View →
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white/5 rounded-lg p-4 text-center">
                            <p className="text-slate-400">No programs currently mapped to this objective</p>
                            <p className="text-sm text-slate-500 mt-1">
                              Consider creating programs to address this strategic goal
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
