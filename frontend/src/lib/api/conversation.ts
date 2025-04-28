/**
 * API service for conversation management
 */
import {
    addConversationToLocalStorage,
    getConversationFromLocalStorage,
    getConversationIdsFromLocalStorage,
    removeConversationFromLocalStorage,
    saveConversationToLocalStorage,
    type ConversationSummary,
} from '../storage/conversation';

// Base URL for API - can be configured based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Get conversation history for a session
 *
 * @param sessionId The session ID to retrieve history for
 * @returns Promise with the conversation history
 */
export async function getConversationHistory(sessionId: string): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/llm/conversation/${sessionId}/`, {
            credentials: 'include', // Add this to include cookies with the request
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error: ${response.status}`);
        }

        const data = await response.json();

        // Track this conversation in local storage
        addConversationToLocalStorage(sessionId, data);

        return data;
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        throw error;
    }
}

/**
 * Delete a conversation session
 *
 * @param sessionId The session ID to delete
 * @returns Promise indicating success or failure
 */
export async function deleteConversation(sessionId: string): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/llm/conversation/${sessionId}/delete/`, {
            method: 'DELETE',
            credentials: 'include', // Add this to include cookies with the request
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error: ${response.status}`);
        }

        // Remove from local storage
        removeConversationFromLocalStorage(sessionId);

        return await response.json();
    } catch (error) {
        console.error('Error deleting conversation:', error);
        throw error;
    }
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

        const conversations = await response.json();

        // Convert API response to ConversationSummary format
        const conversationSummaries: ConversationSummary[] = conversations.map((conv: any) => {
            const firstUserMsg = conv.history.find((msg: any) => msg.role === 'user');
            const lastMsg = conv.history.length > 0 ? conv.history[conv.history.length - 1] : null;

            const summary: ConversationSummary = {
                id: conv.session_id,
                title: firstUserMsg?.content?.substring(0, 30) || 'New Conversation',
                preview: lastMsg?.content?.substring(0, 50) || 'No messages',
                lastMessageDate: lastMsg?.created_at || new Date().toISOString(),
                messageCount: conv.history.length,
            };

            // Update local storage
            saveConversationToLocalStorage(conv.session_id, summary);

            return summary;
        });

        // Sort by most recent
        return conversationSummaries.sort(
            (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime(),
        );
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return fallbackToLocalStorage();
    }
}

/**
 * Fallback to local storage when API fails
 *
 * @returns Conversation summaries from local storage
 */
function fallbackToLocalStorage(): ConversationSummary[] {
    if (typeof localStorage === 'undefined') {
        return [];
    }

    try {
        const conversationIds = getConversationIdsFromLocalStorage();
        const summaries = conversationIds
            .map((id) => getConversationFromLocalStorage(id))
            .filter(Boolean) as ConversationSummary[];

        return summaries.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
    } catch (error) {
        console.error('Error using local storage fallback:', error);
        return [];
    }
}
