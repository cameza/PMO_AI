import axios from 'axios';
import type { Program } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function fetchPrograms(status?: string): Promise<Program[]> {
    try {
        const params = status ? { status } : {};
        const response = await api.get<Program[]>('/api/programs', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch programs:', error);
        throw error;
    }
}

export async function fetchProgram(id: string): Promise<Program> {
    try {
        const response = await api.get<Program>(`/api/programs/${id}`);
        return response.data;
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
