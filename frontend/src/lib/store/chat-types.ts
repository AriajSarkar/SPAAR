/**
 * Type definitions for the chat system
 */

/**
 * Sender types for chat messages
 */
export type MessageSender = 'user' | 'bot';

/**
 * Chat message structure
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
 * Conversation summary for history list
 */
export interface ConversationSummary {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    preview?: string;
    messageCount?: number;
    lastMessageDate?: string;
}

/**
 * Chat store state interface
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
    deletingConversations: Record<string, boolean>;

    // Error states
    error: string | null;
    retryCount: number;

    // Status tracking
    pendingTasks: Record<string, boolean>;
    initialized: boolean;

    // Internal state tracking
    _streamUpdateTimeoutId: NodeJS.Timeout | null;
}

/**
 * Chat store actions interface
 */
export interface ChatActions {
    // Public actions
    sendMessage: (message: string) => Promise<void>;
    handleRetry: (index: number) => void;
    cancelResponse: () => void;
    switchConversation: (sessionId: string) => Promise<void>;
    deleteConversationById: (sessionId: string) => Promise<void>;
    newChat: () => Promise<void>;
    loadAllConversations: () => Promise<void>;
    refreshConversation: () => Promise<void>;

    // Internal actions - not typically called directly by components
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
}
