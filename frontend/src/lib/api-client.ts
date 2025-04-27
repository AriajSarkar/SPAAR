/**
 * API client for LLM (Language Learning Model) interactions
 * This file re-exports all the functionality from the modular structure
 */

// Re-export LLM API functions
export { generateLLMResponse } from './api/llm';

// Re-export conversation API functions
export { 
  getConversationHistory,
  deleteConversation,
  getAllConversations 
} from './api/conversation';

// Re-export conversation storage types and functions
export { 
  type ConversationSummary,
  CONVERSATIONS_STORAGE_KEY
} from './storage/conversation';

// Re-export utility functions
export { generateSessionId } from './utils/id';
export { simulateStreamingResponse } from './utils/streams';
