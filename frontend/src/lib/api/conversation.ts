/**
 * API service for conversation management
 */
import { 
  addConversationToLocalStorage, 
  getConversationFromLocalStorage, 
  getConversationIdsFromLocalStorage,
  removeConversationFromLocalStorage, 
  saveConversationToLocalStorage,
  type ConversationSummary 
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
    const response = await fetch(`${API_BASE_URL}/api/v1/llm/conversation/${sessionId}/`);

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
 * Get all user conversations using local storage tracking
 * Since the /conversations/ endpoint doesn't exist, we'll use local storage and fetch individual histories
 * 
 * @returns Promise with the list of conversation summaries
 */
export async function getAllConversations(): Promise<ConversationSummary[]> {
  try {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    
    // Get list of conversation IDs from local storage
    const conversationIds = getConversationIdsFromLocalStorage();
    
    if (!conversationIds.length) {
      return [];
    }
    
    // Create summaries for each conversation we know about
    const conversationSummaries: ConversationSummary[] = [];
    
    for (const id of conversationIds) {
      try {
        // Try to load cached conversation info first
        const cachedInfo = getConversationFromLocalStorage(id);
        
        if (cachedInfo) {
          conversationSummaries.push(cachedInfo);
        } else {
          // Fetch from API if not cached
          const history = await getConversationHistory(id);
          
          if (history && history.history && history.history.length) {
            // Find the first user message for title and last message for preview
            const firstUserMsg = history.history.find((msg: any) => msg.role === 'user');
            const lastMsg = history.history[history.history.length - 1];
            
            const summary: ConversationSummary = {
              id,
              title: firstUserMsg?.content?.substring(0, 30) || 'New Conversation',
              preview: lastMsg?.content?.substring(0, 50) || 'No messages',
              lastMessageDate: lastMsg?.created_at || new Date().toISOString(),
              messageCount: history.history.length
            };
            
            conversationSummaries.push(summary);
            
            // Cache this conversation summary
            saveConversationToLocalStorage(id, summary);
          }
        }
      } catch (error) {
        console.error(`Error getting history for conversation ${id}:`, error);
      }
    }
    
    // Sort by most recent
    return conversationSummaries.sort((a, b) => 
      new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  } catch (error) {
    console.error('Error building conversation list:', error);
    return [];
  }
}