import axios from 'axios';
import type { Program } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const mapProgram = (p: any): Program => ({
    ...p,
    productLine: p.product_line,
    pipelineStage: p.pipeline_stage,
    launchDate: p.launch_date,
    strategicObjectives: p.strategic_objectives,
    lastUpdate: p.last_update,
    // Risks also need mapping if their fields differ, let's check.
    // Backend Risk: id, program_id, title, severity, description, mitigation, status
    // Frontend Risk: id, programId, title, severity, description, mitigation, status
    risks: p.risks?.map((r: any) => ({
        ...r,
        programId: r.program_id
    })) || []
});

export async function fetchPrograms(status?: string): Promise<Program[]> {
    try {
        const params = status ? { status } : {};
        const response = await api.get<any[]>('/api/programs', { params });
        return response.data.map(mapProgram);
    } catch (error) {
        console.error('Failed to fetch programs:', error);
        throw error;
    }
}

export async function fetchProgram(id: string): Promise<Program> {
    try {
        const response = await api.get<any>(`/api/programs/${id}`);
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
        const response = await fetch(`${API_BASE_URL}/api/agent/chat`, {
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

export default api;
