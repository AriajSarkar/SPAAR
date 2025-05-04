/**
 * API service for conversation management
 */
import { type ConversationSummary } from '../storage/conversation';

// Base URL for API - can be configured based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * API response structure for conversation history
 */
export interface ConversationHistoryResponse {
    session_id: string;
    title?: string;
    history: {
        role: 'user' | 'assistant';
        content: string;
        created_at?: string;
    }[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Get conversation history for a session
 *
 * @param sessionId The session ID to retrieve history for
 * @returns Promise with the conversation history
 */
export async function getConversationHistory(sessionId: string): Promise<ConversationHistoryResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/llm/conversation/${sessionId}/`, {
            credentials: 'include', // Add this to include cookies with the request
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error: ${response.status}`);
        }

        const data = (await response.json()) as ConversationHistoryResponse;
        return data;
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        throw error;
    }
}

/**
 * API response for delete operation
 */
export interface DeleteResponse {
    success: boolean;
    message?: string;
}

/**
 * Delete a conversation session
 *
 * @param sessionId The session ID to delete
 * @returns Promise indicating success or failure
 */
export async function deleteConversation(sessionId: string): Promise<DeleteResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/llm/conversation/${sessionId}/delete/`, {
            method: 'DELETE',
            credentials: 'include', // Add this to include cookies with the request
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error: ${response.status}`);
        }

        return (await response.json()) as DeleteResponse;
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
    }
}

/**
 * API response structure for conversation list item
 */
export interface ConversationApiResponse {
    session_id: string;
    title?: string;
    history: {
        role: 'user' | 'assistant';
        content: string;
        created_at?: string;
    }[];
    created_at?: string;
    updated_at?: string;
}

/**
 * Get all user conversations from the API
 *
 * @returns Promise with the list of conversation summaries
 */
export async function getAllConversations(): Promise<ConversationSummary[]> {
    try {
        // Use the proper API endpoint
        const response = await fetch(`${API_BASE_URL}/api/user-content/`, {
            credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const conversations = (await response.json()) as ConversationApiResponse[];

        // Only process conversations that have actual content
        const validConversations = conversations.filter(
            (conv) => conv.history && Array.isArray(conv.history) && conv.history.length > 0,
        );

        // Convert API response to ConversationSummary format
        const conversationSummaries: ConversationSummary[] = validConversations.map((conv) => {
            const firstUserMsg = conv.history.find((msg) => msg.role === 'user');
            const lastMsg = conv.history.length > 0 ? conv.history[conv.history.length - 1] : null;

            return {
                id: conv.session_id,
                title: firstUserMsg?.content?.substring(0, 30) || 'New Conversation',
                preview: lastMsg?.content?.substring(0, 50) || 'No messages',
                lastMessageDate: lastMsg?.created_at || new Date().toISOString(),
                messageCount: conv.history.length,
                createdAt: conv.created_at || new Date().toISOString(),
                updatedAt: conv.updated_at || new Date().toISOString(),
            };
        });

        // Sort by most recent
        return conversationSummaries.sort(
            (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime(),
        );
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
}
