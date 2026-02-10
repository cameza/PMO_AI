'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    Pencil,
    Trash2,
    Plus,
    X,
    Save,
} from 'lucide-react';
import {
    fetchProgram,
    fetchStrategicObjectives,
    fetchOrgDataSource,
    deleteProgram,
    createRisk,
    updateRisk,
    deleteRisk,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    type StrategicObjective,
    type RiskCreateRequest,
    type RiskUpdateRequest,
    type MilestoneCreateRequest,
    type MilestoneUpdateRequest,
} from '@/lib/api';
import { ProgramFormModal } from '@/components/ProgramFormModal';
import type { Program, Risk, Milestone } from '@/lib/mockData';

interface ProgramDetailModalProps {
    programId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onProgramDeleted?: () => void;
    onProgramUpdated?: () => void;
}

const statusColors: Record<string, string> = {
    'On Track': 'bg-accent-emerald/20 text-accent-emerald',
    'At Risk': 'bg-accent-amber/20 text-accent-amber',
    'Off Track': 'bg-accent-rose/20 text-accent-rose',
    'Completed': 'bg-slate-500/20 text-slate-400',
};

const riskSeverityColors: Record<string, string> = {
    'High': 'text-accent-rose bg-accent-rose/10',
    'Medium': 'text-accent-amber bg-accent-amber/10',
    'Low': 'text-blue-400 bg-blue-400/10',
};

export function ProgramDetailModal({ programId, isOpen, onClose, onProgramDeleted, onProgramUpdated }: ProgramDetailModalProps) {
    const [program, setProgram] = useState<Program | null>(null);
    const [strategicObjectives, setStrategicObjectives] = useState<StrategicObjective[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'manual' | 'synced'>('manual');

    // Edit / Delete program
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Risk CRUD
    const [isAddingRisk, setIsAddingRisk] = useState(false);
    const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
    const [riskForm, setRiskForm] = useState<RiskCreateRequest>({ title: '', severity: 'Medium' });

    // Milestone CRUD
    const [isAddingMilestone, setIsAddingMilestone] = useState(false);
    const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
    const [milestoneForm, setMilestoneForm] = useState<MilestoneCreateRequest>({ name: '' });

    const reloadProgram = async () => {
        if (!programId) return;
        try {
            const data = await fetchProgram(programId);
            setProgram(data);
        } catch (err) {
            console.error('Error reloading program:', err);
        }
    };

    useEffect(() => {
        if (!isOpen || !programId) return;
        setIsLoading(true);
        setProgram(null);
        // Reset CRUD state
        setIsAddingRisk(false);
        setEditingRiskId(null);
        setIsAddingMilestone(false);
        setEditingMilestoneId(null);

        Promise.all([
            fetchProgram(programId),
            fetchStrategicObjectives(),
            fetchOrgDataSource(),
        ]).then(([programData, objectivesData, ds]) => {
            setProgram(programData);
            setStrategicObjectives(objectivesData);
            setDataSource(ds);
        }).catch(err => {
            console.error('Error fetching program:', err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [isOpen, programId]);

    const isManual = dataSource === 'manual';

    const handleDeleteProgram = async () => {
        if (!program) return;
        setIsDeleting(true);
        try {
            await deleteProgram(program.id);
            setIsDeleting(false);
            onClose();
            onProgramDeleted?.();
        } catch (err) {
            console.error('Error deleting program:', err);
            setIsDeleting(false);
        }
    };

    // Risk handlers
    const handleSaveRisk = async () => {
        if (!program || !riskForm.title.trim()) return;
        try {
            if (editingRiskId) {
                const updateData: RiskUpdateRequest = {};
                if (riskForm.title) updateData.title = riskForm.title;
                if (riskForm.severity) updateData.severity = riskForm.severity;
                if (riskForm.description) updateData.description = riskForm.description;
                if (riskForm.mitigation) updateData.mitigation = riskForm.mitigation;
                if (riskForm.status) updateData.status = riskForm.status;
                await updateRisk(program.id, editingRiskId, updateData);
            } else {
                await createRisk(program.id, riskForm);
            }
            setIsAddingRisk(false);
            setEditingRiskId(null);
            setRiskForm({ title: '', severity: 'Medium' });
            await reloadProgram();
        } catch (err) {
            console.error('Error saving risk:', err);
        }
    };

    const handleEditRisk = (risk: Risk) => {
        setEditingRiskId(risk.id);
        setRiskForm({
            title: risk.title,
            severity: risk.severity as 'High' | 'Medium' | 'Low',
            description: risk.description || '',
            mitigation: risk.mitigation || '',
            status: (risk.status || 'Open') as 'Open' | 'Mitigated' | 'Closed',
        });
        setIsAddingRisk(true);
    };

    const handleDeleteRisk = async (riskId: string) => {
        if (!program) return;
        try {
            await deleteRisk(program.id, riskId);
            await reloadProgram();
        } catch (err) {
            console.error('Error deleting risk:', err);
        }
    };

    // Milestone handlers
    const handleSaveMilestone = async () => {
        if (!program || !milestoneForm.name.trim()) return;
        try {
            if (editingMilestoneId) {
                const updateData: MilestoneUpdateRequest = {};
                if (milestoneForm.name) updateData.name = milestoneForm.name;
                if (milestoneForm.due_date) updateData.due_date = milestoneForm.due_date;
                if (milestoneForm.status) updateData.status = milestoneForm.status;
                await updateMilestone(program.id, editingMilestoneId, updateData);
            } else {
                await createMilestone(program.id, milestoneForm);
            }
            setIsAddingMilestone(false);
            setEditingMilestoneId(null);
            setMilestoneForm({ name: '' });
            await reloadProgram();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('Error saving milestone:', msg);
            alert(`Failed to save milestone: ${msg}`);
        }
    };

    const handleEditMilestone = (m: Milestone) => {
        setEditingMilestoneId(m.id);
        setMilestoneForm({
            name: m.name,
            due_date: m.dueDate || '',
            status: (m.status || 'Pending') as 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'At Risk',
        });
        setIsAddingMilestone(true);
    };

    const handleDeleteMilestone = async (milestoneId: string) => {
        if (!program) return;
        try {
            await deleteMilestone(program.id, milestoneId);
            await reloadProgram();
        } catch (err) {
            console.error('Error deleting milestone:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-deep rounded-2xl border border-white/10 w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-400 text-sm">Loading program...</p>
                        </div>
                    </div>
                ) : !program ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-8 h-8 text-accent-rose mx-auto mb-3" />
                            <p className="text-slate-400">Program not found</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-surface/50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-accent-violet to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-white/10">
                                    {(program.owner || 'U').split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white leading-tight">{program.name}</h2>
                                    <p className="text-sm text-slate-500">{program.owner} • {program.team}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isManual && (
                                    <>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setIsDeleteConfirmOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-rose hover:bg-accent-rose/10 rounded-lg transition-colors border border-accent-rose/20"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </>
                                )}
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[program.status] || ''}`}>
                                    {program.status}
                                </div>
                                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Overview Section */}
                            <section className="bg-surface rounded-2xl border border-white/10 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Stage: {program.pipelineStage}
                                    </span>
                                </div>
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Overview</h2>
                                <p className="text-slate-300 leading-relaxed text-base mb-6">
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Risks Section */}
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-accent-rose pl-3">Active Risks</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500">{program.risks.length} total</span>
                                        {isManual && (
                                            <button
                                                onClick={() => { setIsAddingRisk(true); setEditingRiskId(null); setRiskForm({ title: '', severity: 'Medium' }); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent-violet rounded-lg hover:bg-accent-violet/80 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Risk
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Inline Risk Form */}
                                {isAddingRisk && (
                                    <div className="bg-surface rounded-xl border border-accent-violet/30 p-5 mb-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-white">{editingRiskId ? 'Edit Risk' : 'New Risk'}</h3>
                                            <button onClick={() => { setIsAddingRisk(false); setEditingRiskId(null); }} className="p-1 hover:bg-white/5 rounded">
                                                <X className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={riskForm.title}
                                            onChange={e => setRiskForm({ ...riskForm, title: e.target.value })}
                                            className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-accent-violet"
                                            placeholder="Risk title"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={riskForm.severity}
                                                onChange={e => setRiskForm({ ...riskForm, severity: e.target.value as 'High' | 'Medium' | 'Low' })}
                                                className="px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-violet"
                                            >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Low">Low</option>
                                            </select>
                                            <select
                                                value={riskForm.status || 'Open'}
                                                onChange={e => setRiskForm({ ...riskForm, status: e.target.value as 'Open' | 'Mitigated' | 'Closed' })}
                                                className="px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-violet"
                                            >
                                                <option value="Open">Open</option>
                                                <option value="Mitigated">Mitigated</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                        <textarea
                                            value={riskForm.description || ''}
                                            onChange={e => setRiskForm({ ...riskForm, description: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-accent-violet resize-none"
                                            placeholder="Description"
                                        />
                                        <textarea
                                            value={riskForm.mitigation || ''}
                                            onChange={e => setRiskForm({ ...riskForm, mitigation: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-accent-violet resize-none"
                                            placeholder="Mitigation plan"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setIsAddingRisk(false); setEditingRiskId(null); }} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
                                            <button onClick={handleSaveRisk} disabled={!riskForm.title.trim()} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-accent-violet rounded-lg hover:bg-accent-violet/80 disabled:opacity-50 transition-colors">
                                                <Save className="w-3.5 h-3.5" />
                                                {editingRiskId ? 'Save' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {program.risks.length > 0 ? (
                                        program.risks.map((risk) => (
                                            <RiskCard
                                                key={risk.id}
                                                risk={risk}
                                                isManual={isManual}
                                                onEdit={() => handleEditRisk(risk)}
                                                onDelete={() => handleDeleteRisk(risk.id)}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No active risks identified.</p>
                                    )}
                                </div>
                            </section>

                            {/* Milestones Section */}
                            <section>
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest border-l-4 border-accent-violet pl-3">Project Milestones</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500">{program.milestones.length} total</span>
                                        {isManual && (
                                            <button
                                                onClick={() => { setIsAddingMilestone(true); setEditingMilestoneId(null); setMilestoneForm({ name: '' }); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent-violet rounded-lg hover:bg-accent-violet/80 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Milestone
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Inline Milestone Form */}
                                {isAddingMilestone && (
                                    <div className="bg-surface rounded-xl border border-accent-violet/30 p-5 mb-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-white">{editingMilestoneId ? 'Edit Milestone' : 'New Milestone'}</h3>
                                            <button onClick={() => { setIsAddingMilestone(false); setEditingMilestoneId(null); }} className="p-1 hover:bg-white/5 rounded">
                                                <X className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={milestoneForm.name}
                                            onChange={e => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-accent-violet"
                                            placeholder="Milestone name"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Due Date</label>
                                                <input
                                                    type="date"
                                                    value={milestoneForm.due_date || ''}
                                                    onChange={e => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                                                    className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-violet"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Status</label>
                                                <select
                                                    value={milestoneForm.status || 'Pending'}
                                                    onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value as 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'At Risk' })}
                                                    className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-violet"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Overdue">Overdue</option>
                                                    <option value="At Risk">At Risk</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setIsAddingMilestone(false); setEditingMilestoneId(null); }} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
                                            <button onClick={handleSaveMilestone} disabled={!milestoneForm.name.trim()} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-accent-violet rounded-lg hover:bg-accent-violet/80 disabled:opacity-50 transition-colors">
                                                <Save className="w-3.5 h-3.5" />
                                                {editingMilestoneId ? 'Save' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-surface rounded-2xl border border-white/10 p-8">
                                    <MilestoneTimeline
                                        milestones={program.milestones}
                                        isManual={isManual}
                                        onEdit={handleEditMilestone}
                                        onDelete={handleDeleteMilestone}
                                    />
                                </div>
                            </section>
                        </div>

                        {/* Edit Program Modal (nested) */}
                        <ProgramFormModal
                            isOpen={isEditModalOpen}
                            onClose={() => setIsEditModalOpen(false)}
                            onSaved={() => { reloadProgram(); onProgramUpdated?.(); }}
                            program={program}
                        />

                        {/* Delete Confirmation Dialog */}
                        {isDeleteConfirmOpen && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center">
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
                                <div className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-glass p-6 text-center">
                                    <div className="w-12 h-12 bg-accent-rose/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 className="w-6 h-6 text-accent-rose" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Delete Program</h3>
                                    <p className="text-sm text-slate-400 mb-6">
                                        Are you sure you want to delete <strong className="text-white">{program.name}</strong>?
                                        This will also delete all associated risks, milestones, and objective mappings. This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => setIsDeleteConfirmOpen(false)}
                                            className="px-5 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteProgram}
                                            disabled={isDeleting}
                                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent-rose rounded-lg hover:bg-accent-rose/80 disabled:opacity-50 transition-colors"
                                        >
                                            {isDeleting ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            Delete Program
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function RiskCard({ risk, isManual, onEdit, onDelete }: { risk: Risk; isManual?: boolean; onEdit?: () => void; onDelete?: () => void }) {
    return (
        <div className="bg-surface rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${risk.severity === 'High' ? 'bg-accent-rose' :
                        risk.severity === 'Medium' ? 'bg-accent-amber' : 'bg-blue-400'
                        }`} />
                    <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1">{risk.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{risk.description}</p>
                        {risk.mitigation && (
                            <p className="text-xs text-slate-400 mt-2 italic">Mitigation: {risk.mitigation}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${riskSeverityColors[risk.severity] || ''}`}>
                        {risk.severity.substring(0, 3)}
                    </span>
                    {isManual && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={onEdit} className="p-1 hover:bg-white/10 rounded transition-colors" title="Edit">
                                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button onClick={onDelete} className="p-1 hover:bg-accent-rose/10 rounded transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5 text-accent-rose/60" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MilestoneTimeline({ milestones, isManual, onEdit, onDelete }: { milestones: Milestone[]; isManual?: boolean; onEdit?: (m: Milestone) => void; onDelete?: (id: string) => void }) {
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
        <div className="relative pl-8 space-y-12">
            <div className="absolute left-[39px] top-2 bottom-2 w-0.5 bg-white/10" />

            {sortedMilestones.map((m, idx) => {
                const isCompleted = m.status === 'Completed';
                const isAtRisk = m.status === 'At Risk';
                const isOverdue = m.status === 'Overdue';
                const isCurrent = m.status === 'In Progress' && (idx === 0 || sortedMilestones[idx - 1].status === 'Completed');

                return (
                    <div key={m.id} className="relative flex items-start group">
                        {/* Node */}
                        <div className="absolute -left-8 top-0 flex items-center justify-center">
                            {isCompleted ? (
                                <div className="w-6 h-6 bg-accent-violet rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-surface relative z-10">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            ) : isAtRisk ? (
                                <div className="w-6 h-6 bg-accent-amber rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-surface relative z-10">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <div className="absolute inset-0 rounded-full border-2 border-accent-amber/40 animate-ping opacity-50" />
                                </div>
                            ) : isOverdue ? (
                                <div className="w-6 h-6 bg-accent-rose rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-surface relative z-10">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                </div>
                            ) : isCurrent ? (
                                <div className="w-6 h-6 bg-surface border-4 border-accent-violet rounded-full shadow-sm relative z-10">
                                    <div className="absolute inset-0 rounded-full border-2 border-accent-violet/30 animate-ping opacity-75" />
                                </div>
                            ) : (
                                <div className="w-6 h-6 bg-surface border-2 border-white/20 rounded-full shadow-sm relative z-10" />
                            )}
                        </div>

                        <div className="ml-2 flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className={`font-bold text-sm ${isAtRisk ? 'text-accent-amber' : isOverdue ? 'text-accent-rose' : isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                                        {m.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {isCompleted ? `Completed ${m.completedDate || m.dueDate}` : `Due ${m.dueDate || 'TBD'}`}
                                        {isCurrent && <span className="ml-2 px-1.5 py-0.5 bg-accent-violet/20 text-accent-violet rounded font-bold uppercase text-[9px]">In Progress</span>}
                                        {isAtRisk && <span className="ml-2 px-1.5 py-0.5 bg-accent-amber/20 text-accent-amber rounded font-bold uppercase text-[9px]">At Risk</span>}
                                        {isOverdue && <span className="ml-2 px-1.5 py-0.5 bg-accent-rose/20 text-accent-rose rounded font-bold uppercase text-[9px]">Overdue</span>}
                                    </p>
                                </div>
                                {isManual && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit?.(m)} className="p-1 hover:bg-white/10 rounded transition-colors" title="Edit">
                                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                        <button onClick={() => onDelete?.(m.id)} className="p-1 hover:bg-accent-rose/10 rounded transition-colors" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5 text-accent-rose/60" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
