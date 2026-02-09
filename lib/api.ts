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

export default api;
