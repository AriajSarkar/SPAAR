/**
 * Utility functions for managing conversations in localStorage
 */

// Local storage key for tracking conversation IDs
export const CONVERSATIONS_STORAGE_KEY = 'heart_chat_conversations';

/**
 * Conversation summary interface
 */
export interface ConversationSummary {
    id: string;
    title: string;
    preview: string;
    lastMessageDate: string;
    messageCount: number;
}

/**
 * Get conversation IDs from local storage
 */
export function getConversationIdsFromLocalStorage(): string[] {
    if (typeof localStorage === 'undefined') {
        return [];
    }

    const savedIds = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    return savedIds ? JSON.parse(savedIds) : [];
}

/**
 * Add a conversation ID to local storage tracking
 */
export function addConversationToLocalStorage(sessionId: string, data: Record<string, unknown>): void {
    if (typeof localStorage === 'undefined') {
        return;
    }

    // Get existing IDs
    const conversationIds = getConversationIdsFromLocalStorage();

    // Add if not already in the list
    if (!conversationIds.includes(sessionId)) {
        conversationIds.push(sessionId);
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversationIds));
    }

    // Also create a summary if we have message data
    if (data && Array.isArray(data.history) && data.history.length) {
        const firstUserMsg = data.history.find((msg: Record<string, unknown>) => msg.role === 'user');
        const lastMsg = data.history[data.history.length - 1];

        const summary: ConversationSummary = {
            id: sessionId,
            title:
                typeof firstUserMsg?.content === 'string' ? firstUserMsg.content.substring(0, 30) : 'New Conversation',
            preview: typeof lastMsg?.content === 'string' ? lastMsg.content.substring(0, 50) : 'No messages',
            lastMessageDate: typeof lastMsg?.created_at === 'string' ? lastMsg.created_at : new Date().toISOString(),
            messageCount: data.history.length,
        };

        saveConversationToLocalStorage(sessionId, summary);
    }
}

/**
 * Remove a conversation ID from local storage tracking
 */
export function removeConversationFromLocalStorage(sessionId: string): void {
    if (typeof localStorage === 'undefined') {
        return;
    }

    // Get existing IDs
    let conversationIds = getConversationIdsFromLocalStorage();

    // Remove this ID
    conversationIds = conversationIds.filter((id) => id !== sessionId);
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversationIds));

    // Also remove the individual conversation cache
    localStorage.removeItem(`heart_chat_conversation_${sessionId}`);
}

/**
 * Save conversation summary to local storage
 */
export function saveConversationToLocalStorage(sessionId: string, summary: ConversationSummary): void {
    if (typeof localStorage === 'undefined') {
        return;
    }

    localStorage.setItem(`heart_chat_conversation_${sessionId}`, JSON.stringify(summary));
}

/**
 * Get cached conversation summary from local storage
 */
export function getConversationFromLocalStorage(sessionId: string): ConversationSummary | null {
    if (typeof localStorage === 'undefined') {
        return null;
    }

    const cached = localStorage.getItem(`heart_chat_conversation_${sessionId}`);
    return cached ? JSON.parse(cached) : null;
}
