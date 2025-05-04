/**
 * Chat Store Module
 *
 * This module provides a Zustand-based state management solution for chat functionality
 * with IndexedDB persistence via Dexie.js for offline support and faster loading.
 */

// Re-export the store and initialization function
export { default as useChatStore } from './store';
export { initializeChatStore } from './store';

// Re-export types that might be needed by consumers
export type { ChatMessage, ConversationSummary, MessageSender } from './types';
