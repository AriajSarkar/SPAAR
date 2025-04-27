/**
 * Types for the chat feature
 */

import { StateCreator } from 'zustand';

/**
 * Defines possible message sender types
 */
export type MessageSender = 'user' | 'bot';

/**
 * Represents a chat message
 */
export interface ChatMessage {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  error?: boolean;
  isRetryable?: boolean;
}

/**
 * Summary of a conversation for sidebar display
 */
export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Record tracking conversations being deleted
 */
export interface DeletingConversationsRecord {
  [sessionId: string]: boolean;
}

/**
 * Record tracking pending tasks
 */
export interface PendingTasksRecord {
  [taskId: string]: boolean;
}

/**
 * Main chat state shape
 */
export interface ChatState {
  // Chat message state
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamContent: string;
  abortController: AbortController | null;
  
  // Session management
  sessionId: string | null;
  conversations: ConversationSummary[];
  loadingConversations: boolean;
  deletingConversations: DeletingConversationsRecord;
  
  // Error states
  error: string | null;
  retryCount: number;
  
  // Status tracking
  pendingTasks: PendingTasksRecord;
  initialized: boolean;
  isReady?: boolean;
}

/**
 * Actions that can be performed on the chat store
 */
export interface ChatActions {
  // Private internal state mutations
  _addMessage: (message: ChatMessage) => void;
  _updateLastBotMessage: (content: string) => void;
  _setLoading: (isLoading: boolean) => void;
  _setStreaming: (isStreaming: boolean) => void;
  _setStreamContent: (content: string) => void;
  _setAbortController: (controller: AbortController | null) => void;
  _setSessionId: (sessionId: string | null) => void;
  _setConversations: (conversations: ConversationSummary[]) => void;
  _setLoadingConversations: (loading: boolean) => void;
  _setDeletingConversation: (sessionId: string, isDeleting: boolean) => void;
  _setError: (error: string | null) => void;
  _setPendingTask: (taskId: string, isPending: boolean) => void;
  _setInitialized: (initialized: boolean) => void;
  _addOrUpdateConversation: (sessionId: string, title?: string) => void;
  
  // Public API
  loadAllConversations: () => Promise<void>;
  refreshConversation: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  handleRetry: (index: number) => void;
  cancelResponse: () => void;
  switchConversation: (sessionId: string) => Promise<void>;
  deleteConversationById: (sessionId: string) => Promise<void>;
  newChat: () => Promise<void>;
}

export type ChatStoreSlice = StateCreator<ChatState & ChatActions, [], [], ChatState & ChatActions>;