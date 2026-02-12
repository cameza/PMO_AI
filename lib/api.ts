import axios from 'axios';
import type { Program } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProgram = (p: any): Program => ({
    ...p,
    name: p.name || 'Unnamed Program',
    owner: p.owner || 'Unassigned',
    status: p.status || 'On Track',
    description: p.description || '',
    progress: p.progress ?? 0,
    productLine: p.product_line || '',
    pipelineStage: p.pipeline_stage || '',
    launchDate: p.launch_date || '',
    strategicObjectives: p.strategic_objectives || [],
    lastUpdate: p.last_update || '',
    // Risks also need mapping if their fields differ, let's check.
    // Backend Risk: id, program_id, title, severity, description, mitigation, status
    // Frontend Risk: id, programId, title, severity, description, mitigation, status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    risks: p.risks?.map((r: any) => ({
        ...r,
        programId: r.program_id
    })) || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    milestones: p.milestones?.map((m: any) => ({
        ...m,
        programId: m.program_id,
        dueDate: m.due_date,
        completedDate: m.completed_date
    })) || []
});

export async function fetchPrograms(status?: string): Promise<Program[]> {
    try {
        const params = status ? { status } : {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.get<any[]>('/api/py/programs', { params });
        return response.data.map(mapProgram);
    } catch (error) {
        console.error('Failed to fetch programs:', error);
        throw error;
    }
}

export async function fetchProgram(id: string): Promise<Program> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.get<any>(`/api/py/programs/${id}`);
        return mapProgram(response.data);
    } catch (error) {
        console.error('Failed to fetch program:', error);
        throw error;
    }
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    message: string;
    history: ChatMessage[];
    context?: {
        programId?: string;
    };
}

export async function sendChatMessage(request: ChatRequest): Promise<ReadableStream<Uint8Array> | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/py/agent/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        return response.body;
    } catch (error) {
        console.error('Failed to send chat message:', error);
        throw error;
    }
}

// Strategic Objectives API
export interface StrategicObjective {
    id: string;
    name: string;
    description?: string;
    priority: number;
    owner?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateStrategicObjectiveRequest {
    name: string;
    description?: string;
    priority: number;
    owner?: string;
}

export async function fetchStrategicObjectives(): Promise<StrategicObjective[]> {
    try {
        const response = await api.get<StrategicObjective[]>('/api/py/strategic-objectives');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch strategic objectives:', error);
        throw error;
    }
}

export async function createStrategicObjective(data: CreateStrategicObjectiveRequest): Promise<StrategicObjective> {
    try {
        const response = await api.post<StrategicObjective>('/api/py/strategic-objectives', data);
        return response.data;
    } catch (error) {
        console.error('Failed to create strategic objective:', error);
        throw error;
    }
}

export async function updateStrategicObjective(id: string, data: CreateStrategicObjectiveRequest & { id: string }): Promise<StrategicObjective> {
    try {
        const response = await api.put<StrategicObjective>(`/api/py/strategic-objectives/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to update strategic objective:', error);
        throw error;
    }
}

export async function deleteStrategicObjective(id: string): Promise<void> {
    try {
        await api.delete(`/api/py/strategic-objectives/${id}`);
    } catch (error) {
        console.error('Failed to delete strategic objective:', error);
        throw error;
    }
}

export async function updateProgramStrategicObjectives(programId: string, objectiveIds: string[]): Promise<Program> {
    try {
        const response = await api.put<Program>(`/api/py/programs/${programId}/strategic-objectives`, {
            strategic_objective_ids: objectiveIds
        });
        return mapProgram(response.data);
    } catch (error) {
        console.error('Failed to update program strategic objectives:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Organization data source
// ---------------------------------------------------------------------------

export async function fetchOrgDataSource(): Promise<'manual' | 'synced'> {
    try {
        const response = await api.get<{ data_source: string }>('/api/py/org/data-source');
        return response.data.data_source as 'manual' | 'synced';
    } catch (error) {
        console.error('Failed to fetch org data source:', error);
        return 'manual';
    }
}

// ---------------------------------------------------------------------------
// Program CRUD
// ---------------------------------------------------------------------------

export interface ProgramCreateRequest {
    name: string;
    description?: string;
    status?: string;
    owner?: string;
    team?: string;
    product_line?: string;
    pipeline_stage?: string;
    launch_date?: string;
    progress?: number;
    last_update?: string;
    strategic_objective_ids?: string[];
}

export interface ProgramUpdateRequest {
    name?: string;
    description?: string;
    status?: string;
    owner?: string;
    team?: string;
    product_line?: string;
    pipeline_stage?: string;
    launch_date?: string;
    progress?: number;
    last_update?: string;
    strategic_objective_ids?: string[];
}

export async function createProgram(data: ProgramCreateRequest): Promise<Program> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.post<any>('/api/py/programs', data);
        return mapProgram(response.data);
    } catch (error) {
        console.error('Failed to create program:', error);
        throw error;
    }
}

export async function updateProgram(id: string, data: ProgramUpdateRequest): Promise<Program> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.patch<any>(`/api/py/programs/${id}`, data);
        return mapProgram(response.data);
    } catch (error) {
        console.error('Failed to update program:', error);
        throw error;
    }
}

export async function deleteProgram(id: string): Promise<void> {
    try {
        await api.delete(`/api/py/programs/${id}`);
    } catch (error) {
        console.error('Failed to delete program:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Risk CRUD
// ---------------------------------------------------------------------------

export interface RiskCreateRequest {
    title: string;
    severity: 'High' | 'Medium' | 'Low';
    description?: string;
    mitigation?: string;
    status?: 'Open' | 'Mitigated' | 'Closed';
}

export interface RiskUpdateRequest {
    title?: string;
    severity?: 'High' | 'Medium' | 'Low';
    description?: string;
    mitigation?: string;
    status?: 'Open' | 'Mitigated' | 'Closed';
}

export async function createRisk(programId: string, data: RiskCreateRequest) {
    try {
        const response = await api.post(`/api/py/programs/${programId}/risks`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to create risk:', error);
        throw error;
    }
}

export async function updateRisk(programId: string, riskId: string, data: RiskUpdateRequest) {
    try {
        const response = await api.patch(`/api/py/programs/${programId}/risks/${riskId}`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to update risk:', error);
        throw error;
    }
}

export async function deleteRisk(programId: string, riskId: string): Promise<void> {
    try {
        await api.delete(`/api/py/programs/${programId}/risks/${riskId}`);
    } catch (error) {
        console.error('Failed to delete risk:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Milestone CRUD
// ---------------------------------------------------------------------------

export interface MilestoneCreateRequest {
    name: string;
    due_date?: string;
    completed_date?: string;
    status?: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'At Risk';
}

export interface MilestoneUpdateRequest {
    name?: string;
    due_date?: string;
    completed_date?: string;
    status?: 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'At Risk';
}

export async function createMilestone(programId: string, data: MilestoneCreateRequest) {
    try {
        const response = await api.post(`/api/py/programs/${programId}/milestones`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to create milestone:', error);
        throw error;
    }
}

export async function updateMilestone(programId: string, milestoneId: string, data: MilestoneUpdateRequest) {
    try {
        const response = await api.patch(`/api/py/programs/${programId}/milestones/${milestoneId}`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to update milestone:', error);
        throw error;
    }
}

export async function deleteMilestone(programId: string, milestoneId: string): Promise<void> {
    try {
        await api.delete(`/api/py/programs/${programId}/milestones/${milestoneId}`);
    } catch (error) {
        console.error('Failed to delete milestone:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Integration API
// ---------------------------------------------------------------------------

export interface IntegrationStatus {
    connected: boolean;
    tool?: string;
    status?: string;
    last_sync_at?: string;
    organization?: {
        workspace_id?: string;
        workspace_name?: string;
        workspace_url_key?: string;
    };
}

export interface SyncResult {
    strategic_objectives: number;
    programs: number;
    milestones: number;
    last_sync_at?: string;
}

export async function connectLinear(apiKey: string): Promise<{ success: boolean; integration_id?: string; organization?: Record<string, string>; error?: string }> {
    try {
        const response = await api.post('/api/py/integrations/linear/connect', { api_key: apiKey });
        return response.data;
    } catch (error) {
        console.error('Failed to connect Linear:', error);
        throw error;
    }
}

export async function syncLinear(): Promise<SyncResult> {
    try {
        // Sync can take 30-60s due to hundreds of Supabase upserts.
        // In dev, bypass Next.js rewrite proxy (which has a short timeout)
        // and hit FastAPI directly.
        const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        const syncUrl = isDev
            ? 'http://127.0.0.1:8000/api/integrations/linear/sync'
            : '/api/py/integrations/linear/sync';
        const response = await axios.post<SyncResult>(syncUrl, {}, { timeout: 120000 });
        return response.data;
    } catch (error) {
        console.error('Failed to sync Linear:', error);
        throw error;
    }
}

export async function fetchIntegrationStatus(): Promise<IntegrationStatus> {
    try {
        const response = await api.get<IntegrationStatus>('/api/py/integrations/status');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch integration status:', error);
        return { connected: false };
    }
}

export async function disconnectLinear(): Promise<void> {
    try {
        await api.delete('/api/py/integrations/linear');
    } catch (error) {
        console.error('Failed to disconnect Linear:', error);
        throw error;
    }
}

export async function toggleDataSource(dataSource: 'manual' | 'synced'): Promise<{ data_source: string }> {
    try {
        const response = await api.patch<{ data_source: string }>('/api/py/org/data-source', { data_source: dataSource });
        return response.data;
    } catch (error) {
        console.error('Failed to toggle data source:', error);
        throw error;
    }
}

export default api;
