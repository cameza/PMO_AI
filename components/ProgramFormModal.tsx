'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Search, Check } from 'lucide-react';
import {
    createProgram,
    updateProgram,
    fetchStrategicObjectives,
    type ProgramCreateRequest,
    type ProgramUpdateRequest,
    type StrategicObjective,
} from '@/lib/api';
import type { Program } from '@/lib/mockData';

interface ProgramFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (program: Program) => void;
    program?: Program | null;
}

const STATUS_OPTIONS = ['On Track', 'At Risk', 'Off Track', 'Completed'];
const PIPELINE_STAGES = ['Discovery', 'Planning', 'In Progress', 'Launching', 'Completed'];
const PRODUCT_LINES = ['Smart Home', 'Mobile', 'Platform', 'Video'];

export function ProgramFormModal({ isOpen, onClose, onSaved, program }: ProgramFormModalProps) {
    const isEditing = !!program;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('On Track');
    const [owner, setOwner] = useState('');
    const [team, setTeam] = useState('');
    const [productLine, setProductLine] = useState('');
    const [pipelineStage, setPipelineStage] = useState('');
    const [launchDate, setLaunchDate] = useState('');
    const [progress, setProgress] = useState(0);
    const [lastUpdate, setLastUpdate] = useState('');
    const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);

    const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
    const [objectiveSearch, setObjectiveSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchStrategicObjectives()
                .then(setObjectives)
                .catch(() => setObjectives([]));
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && program) {
            setName(program.name || '');
            setDescription(program.description || '');
            setStatus(program.status || 'On Track');
            setOwner(program.owner || '');
            setTeam(program.team || '');
            setProductLine(program.productLine || '');
            setPipelineStage(program.pipelineStage || '');
            setLaunchDate(program.launchDate || '');
            setProgress(program.progress || 0);
            setLastUpdate(program.lastUpdate || '');
            setSelectedObjectiveIds(
                objectives
                    .filter(o => program.strategicObjectives?.includes(o.name))
                    .map(o => o.id)
            );
        } else if (isOpen) {
            resetForm();
        }
    }, [isOpen, program, objectives]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setStatus('On Track');
        setOwner('');
        setTeam('');
        setProductLine('');
        setPipelineStage('');
        setLaunchDate('');
        setProgress(0);
        setLastUpdate('');
        setSelectedObjectiveIds([]);
        setObjectiveSearch('');
        setError(null);
    };

    const toggleObjective = (id: string) => {
        setSelectedObjectiveIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredObjectives = objectives.filter(o =>
        o.name.toLowerCase().includes(objectiveSearch.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Program name is required');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            if (isEditing && program) {
                const data: ProgramUpdateRequest = {
                    name,
                    description: description || undefined,
                    status,
                    owner: owner || undefined,
                    team: team || undefined,
                    product_line: productLine || undefined,
                    pipeline_stage: pipelineStage || undefined,
                    launch_date: launchDate || undefined,
                    progress,
                    last_update: lastUpdate || undefined,
                    strategic_objective_ids: selectedObjectiveIds.length > 0 ? selectedObjectiveIds : undefined,
                };
                const updated = await updateProgram(program.id, data);
                onSaved(updated);
            } else {
                const data: ProgramCreateRequest = {
                    name,
                    description: description || undefined,
                    status,
                    owner: owner || undefined,
                    team: team || undefined,
                    product_line: productLine || undefined,
                    pipeline_stage: pipelineStage || undefined,
                    launch_date: launchDate || undefined,
                    progress,
                    last_update: lastUpdate || undefined,
                    strategic_objective_ids: selectedObjectiveIds,
                };
                const created = await createProgram(data);
                onSaved(created);
            }
            onClose();
        } catch (err) {
            console.error('Failed to save program:', err);
            setError(isEditing ? 'Failed to update program' : 'Failed to create program');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-surface border border-white/10 rounded-2xl shadow-glass overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">
                        {isEditing ? 'Edit Program' : 'New Program'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-lg p-3 text-sm text-accent-rose">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Name <span className="text-accent-rose">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet transition-colors"
                            placeholder="Program name"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet transition-colors resize-none"
                            placeholder="Describe this program"
                        />
                    </div>

                    {/* Status + Pipeline Stage */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-violet transition-colors"
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Pipeline Stage</label>
                            <select
                                value={pipelineStage}
                                onChange={e => setPipelineStage(e.target.value)}
                                className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-violet transition-colors"
                            >
                                <option value="">Select stage</option>
                                {PIPELINE_STAGES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Owner + Team */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Owner</label>
                            <input
                                type="text"
                                value={owner}
                                onChange={e => setOwner(e.target.value)}
                                className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet transition-colors"
                                placeholder="Program owner"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Team</label>
                            <input
                                type="text"
                                value={team}
                                onChange={e => setTeam(e.target.value)}
                                className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet transition-colors"
                                placeholder="Team name"
                            />
                        </div>
                    </div>

                    {/* Product Line + Launch Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Product Line</label>
                            <select
                                value={productLine}
                                onChange={e => setProductLine(e.target.value)}
                                className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-violet transition-colors"
                            >
                                <option value="">Select product line</option>
                                {PRODUCT_LINES.map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Launch Date</label>
                            <input
                                type="date"
                                value={launchDate}
                                onChange={e => setLaunchDate(e.target.value)}
                                className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-violet transition-colors"
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Progress: {progress}%
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={progress}
                            onChange={e => setProgress(parseInt(e.target.value))}
                            className="w-full accent-accent-violet"
                        />
                    </div>

                    {/* Last Update */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Latest Update</label>
                        <textarea
                            value={lastUpdate}
                            onChange={e => setLastUpdate(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-deep border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet transition-colors resize-none"
                            placeholder="Latest status update"
                        />
                    </div>

                    {/* Strategic Objectives Picker */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Strategic Objectives
                            {selectedObjectiveIds.length > 0 && (
                                <span className="ml-2 text-accent-violet">({selectedObjectiveIds.length} selected)</span>
                            )}
                        </label>
                        <div className="bg-deep border border-white/10 rounded-lg overflow-hidden">
                            {/* Search */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                                <Search className="w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={objectiveSearch}
                                    onChange={e => setObjectiveSearch(e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                                    placeholder="Search objectives..."
                                />
                            </div>
                            {/* List */}
                            <div className="max-h-40 overflow-y-auto">
                                {filteredObjectives.length === 0 ? (
                                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                                        No objectives found
                                    </div>
                                ) : (
                                    filteredObjectives.map(obj => {
                                        const isSelected = selectedObjectiveIds.includes(obj.id);
                                        return (
                                            <button
                                                key={obj.id}
                                                type="button"
                                                onClick={() => toggleObjective(obj.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${isSelected ? 'bg-accent-violet/10' : ''}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-accent-violet border-accent-violet' : 'border-white/20'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={isSelected ? 'text-white font-medium' : 'text-slate-300'}>
                                                    {obj.name}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !name.trim()}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-accent-violet rounded-lg hover:bg-accent-violet/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isEditing ? (
                            <Save className="w-4 h-4" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        {isEditing ? 'Save Changes' : 'Create Program'}
                    </button>
                </div>
            </div>
        </div>
    );
}
