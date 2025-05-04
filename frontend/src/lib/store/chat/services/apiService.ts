import {
    generateLLMResponse,
    getConversationHistory,
    deleteConversation,
    getAllConversations,
    generateSessionId,
} from '@/lib/api-client';
import type { ConversationSummary } from '../types';

/**
 * API service for chat operations
 * Provides a clean interface to backend API calls
 */
export const apiService = {
    /**
     * Generate a unique session ID
     */
    generateSessionId(): string {
        return generateSessionId();
    },

    /**
     * Get all conversations from the API
     */
    async getAllConversations(): Promise<ConversationSummary[]> {
        const allConversations = await getAllConversations();

        // Transform responses to match our local type structure
        return (allConversations as unknown[]).map((conv) => {
            // Create a safely typed record to extract properties
            const typedConv = conv as Record<string, unknown>;
            return {
                id: String(typedConv.id || ''),
                title: String(typedConv.title || 'Untitled conversation'),
                createdAt: String(typedConv.created_at || new Date().toISOString()),
                updatedAt: String(typedConv.updated_at || new Date().toISOString()),
            };
        });
    },

    /**
     * Get conversation history from the API
     */
    async getConversationHistory(sessionId: string) {
        return await getConversationHistory(sessionId);
    },

    /**
     * Delete a conversation from the API
     */
    async deleteConversation(sessionId: string): Promise<void> {
        await deleteConversation(sessionId);
    },

    /**
     * Generate LLM response from the API with streaming support
     */
    async generateLLMResponse(
        message: string,
        sessionId: string,
        streaming: boolean = true,
        handleChunk?: (chunk: string) => void,
    ) {
        return await generateLLMResponse(message, sessionId, streaming, handleChunk);
    },
};
