/**
 * API client for LLM (Language Learning Model) interactions
 */

// Base URL for API - can be configured based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export interface ConversationSummary {
  id: string;
  title: string;
  preview: string;
  lastMessageDate: string;
  messageCount: number;
}

// Local storage key for tracking conversation IDs
const CONVERSATIONS_STORAGE_KEY = 'heart_chat_conversations';

/**
 * Generate a response from the LLM with streaming support
 * 
 * @param prompt The user's question or request
 * @param sessionId Optional session ID for conversation context
 * @param includeHistory Whether to include conversation history
 * @param onChunk Callback for receiving streaming chunks
 * @returns Promise with the LLM response
 */
export async function generateLLMResponse(
  prompt: string, 
  sessionId?: string,
  includeHistory: boolean = true,
  onChunk?: ((chunk: string) => void) | boolean
): Promise<any> {
  try {
    // Check if onChunk is a function
    const streamCallback = typeof onChunk === 'function' ? onChunk : undefined;
    
    // Always use direct backend endpoint
    const endpoint = `${API_BASE_URL}/api/v1/llm/generate/`;
    
    // Configure headers - don't explicitly request SSE to avoid 406 error
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      // Let the server decide the response format
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        session_id: sessionId,
        include_history: includeHistory
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Check if the response is SSE format
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream') && streamCallback) {
      // Process as event stream
      let fullResponse = '';
      
      // Create a new event source from the response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get reader from response');
      }
      
      // Read the stream
      let decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last potentially incomplete line
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            
            if (data === '[DONE]') {
              // Stream completed
              continue;
            }
            
            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.candidates && 
                  parsedData.candidates[0]?.content?.parts?.[0]) {
                const text = parsedData.candidates[0].content.parts[0].text || '';
                if (text) {
                  fullResponse += text;
                  streamCallback(text);
                }
              }
            } catch (e) {
              console.warn("Error parsing chunk:", e);
            }
          }
        }
      }
      
      // Return the full response
      return { response: fullResponse };
    } else {
      try {
        // Try to parse as JSON first
        const data = await response.json();
        
        // Extract response text
        let responseText = '';
        if (data.response) {
          responseText = data.response;
        } else if (data.candidates && 
                  data.candidates[0]?.content?.parts) {
          responseText = data.candidates[0].content.parts
            .map((part: any) => part.text || '')
            .join('');
        }
        
        // If we have a callback, simulate streaming
        if (streamCallback && responseText) {
          simulateStreamingResponse(responseText, streamCallback);
        }
        
        return { response: responseText, ...data };
      } catch (jsonError) {
        // If JSON parsing fails, try to process as text
        const text = await response.text();
        
        if (streamCallback) {
          simulateStreamingResponse(text, streamCallback);
        }
        
        return { response: text };
      }
    }
  } catch (error) {
    console.error('Error generating LLM response:', error);
    throw error;
  }
}

/**
 * Simulates streaming response by chunking text and using setTimeout
 */
function simulateStreamingResponse(text: string, onChunk: (chunk: string) => void) {
  // Split response into words or smaller chunks
  const words = text.split(/\s+/);
  let currentIndex = 0;
  
  // Use a function that processes chunks with setTimeout
  function processNextChunk() {
    if (currentIndex >= words.length) return;
    
    // Determine how many words to send in this chunk (random between 1-5)
    const wordsToSend = Math.min(
      Math.floor(Math.random() * 5) + 1, 
      words.length - currentIndex
    );
    
    // Create the chunk
    const chunk = words.slice(currentIndex, currentIndex + wordsToSend).join(' ') + ' ';
    currentIndex += wordsToSend;
    
    // Send the chunk
    onChunk(chunk);
    
    // Schedule the next chunk with a small random delay
    if (currentIndex < words.length) {
      setTimeout(processNextChunk, Math.random() * 50 + 10);
    }
  }
  
  // Start the streaming simulation
  processNextChunk();
}

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

/**
 * Get conversation IDs from local storage
 */
function getConversationIdsFromLocalStorage(): string[] {
  if (typeof localStorage === 'undefined') {
    return [];
  }
  
  const savedIds = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
  return savedIds ? JSON.parse(savedIds) : [];
}

/**
 * Add a conversation ID to local storage tracking
 */
function addConversationToLocalStorage(sessionId: string, data: any): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  
  // Get existing IDs
  let conversationIds = getConversationIdsFromLocalStorage();
  
  // Add if not already in the list
  if (!conversationIds.includes(sessionId)) {
    conversationIds.push(sessionId);
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversationIds));
  }
  
  // Also create a summary if we have message data
  if (data && data.history && data.history.length) {
    const firstUserMsg = data.history.find((msg: any) => msg.role === 'user');
    const lastMsg = data.history[data.history.length - 1];
    
    const summary: ConversationSummary = {
      id: sessionId,
      title: firstUserMsg?.content?.substring(0, 30) || 'New Conversation',
      preview: lastMsg?.content?.substring(0, 50) || 'No messages',
      lastMessageDate: lastMsg?.created_at || new Date().toISOString(),
      messageCount: data.history.length
    };
    
    saveConversationToLocalStorage(sessionId, summary);
  }
}

/**
 * Remove a conversation ID from local storage tracking
 */
function removeConversationFromLocalStorage(sessionId: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  
  // Get existing IDs
  let conversationIds = getConversationIdsFromLocalStorage();
  
  // Remove this ID
  conversationIds = conversationIds.filter(id => id !== sessionId);
  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversationIds));
  
  // Also remove the individual conversation cache
  localStorage.removeItem(`heart_chat_conversation_${sessionId}`);
}

/**
 * Save conversation summary to local storage
 */
function saveConversationToLocalStorage(sessionId: string, summary: ConversationSummary): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  
  localStorage.setItem(`heart_chat_conversation_${sessionId}`, JSON.stringify(summary));
}

/**
 * Get cached conversation summary from local storage
 */
function getConversationFromLocalStorage(sessionId: string): ConversationSummary | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  
  const cached = localStorage.getItem(`heart_chat_conversation_${sessionId}`);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Helper function to generate a new session ID
 * Uses a UUID format for uniqueness
 * 
 * @returns A unique session ID string
 */
export function generateSessionId(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
