'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { fetchStrategicObjectives, createStrategicObjective, updateStrategicObjective, deleteStrategicObjective } from '@/lib/api';

interface StrategicObjective {
  id: string;
  name: string;
  description?: string;
  priority: number;
  owner?: string;
  created_at?: string;
  updated_at?: string;
}

interface ObjectiveFormData {
  name: string;
  description: string;
  priority: number;
  owner: string;
}

export function StrategicObjectivesAdmin() {
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ObjectiveFormData>({
    name: '',
    description: '',
    priority: 1,
    owner: ''
  });

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    try {
      setIsLoading(true);
      const data = await fetchStrategicObjectives();
      setObjectives(data);
      setError(null);
    } catch (err) {
      setError('Failed to load strategic objectives');
      console.error('Error loading objectives:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    try {
      const newObjective = await createStrategicObjective(formData);
      setObjectives([...objectives, newObjective]);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to create strategic objective');
      console.error('Error creating objective:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) return;

    try {
      const updatedObjective = await updateStrategicObjective(id, { ...formData, id });
      setObjectives(objectives.map(obj => obj.id === id ? updatedObjective : obj));
      setEditingId(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError('Failed to update strategic objective');
      console.error('Error updating objective:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategic objective?')) return;

    try {
      await deleteStrategicObjective(id);
      setObjectives(objectives.filter(obj => obj.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete strategic objective');
      console.error('Error deleting objective:', err);
    }
  };

  const startEdit = (objective: StrategicObjective) => {
    setEditingId(objective.id);
    setFormData({
      name: objective.name,
      description: objective.description || '',
      priority: objective.priority,
      owner: objective.owner || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 1,
      owner: ''
    });
  };

  const isEditing = editingId !== null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-violet"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategic Objectives</h1>
          <p className="text-slate-400">Manage your organization&apos;s strategic objectives</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={!formData.name.trim() || isEditing}
          className="flex items-center gap-2 bg-accent-violet text-white px-4 py-2 rounded-lg hover:bg-accent-violet/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Objective
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-accent-rose/20 border border-accent-rose/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-accent-rose" />
          <span className="text-accent-rose">{error}</span>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isEditing || formData.name) && (
        <div className="bg-surface rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {isEditing ? 'Edit Objective' : 'Create New Objective'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet"
                placeholder="Enter objective name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet resize-none"
                rows={3}
                placeholder="Describe this strategic objective"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-violet"
                >
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Owner
                </label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-accent-violet"
                  placeholder="Team or person responsible"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => handleUpdate(editingId!)}
                    disabled={!formData.name.trim()}
                    className="flex items-center gap-2 bg-accent-emerald text-white px-4 py-2 rounded-lg hover:bg-accent-emerald/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-2 bg-accent-violet text-white px-4 py-2 rounded-lg hover:bg-accent-violet/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Objective
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Objectives List */}
      <div className="space-y-3">
        {objectives.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-xl border border-white/10">
            <p className="text-slate-400">No strategic objectives defined yet.</p>
            <p className="text-slate-500 text-sm mt-2">Create your first objective to get started.</p>
          </div>
        ) : (
          objectives.map((objective) => (
            <div
              key={objective.id}
              className="bg-surface rounded-xl border border-white/10 p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{objective.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      objective.priority === 1 
                        ? 'bg-accent-rose/20 text-accent-rose'
                        : objective.priority === 2
                        ? 'bg-accent-amber/20 text-accent-amber'
                        : 'bg-accent-emerald/20 text-accent-emerald'
                    }`}>
                      {objective.priority === 1 ? 'High' : objective.priority === 2 ? 'Medium' : 'Low'} Priority
                    </span>
                  </div>
                  
                  {objective.description && (
                    <p className="text-slate-300 mb-3">{objective.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    {objective.owner && (
                      <span>Owner: {objective.owner}</span>
                    )}
                    {objective.created_at && (
                      <span>Created: {new Date(objective.created_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => startEdit(objective)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(objective.id)}
                    className="p-2 text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
