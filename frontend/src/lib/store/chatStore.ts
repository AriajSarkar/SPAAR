import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    generateLLMResponse,
    getConversationHistory,
    deleteConversation,
    getAllConversations,
    generateSessionId,
    ConversationSummary,
} from '@/lib/api-client';
import { enqueueTask } from '@/lib/utils/taskQueue';

// Types for messages
export type MessageSender = 'user' | 'bot';
export interface ChatMessage {
    id: string;
    content: string;
    sender: MessageSender;
    timestamp: Date;
    error?: boolean;
    isRetryable?: boolean;
}

// Store state interface
interface ChatState {
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
    deletingConversations: Record<string, boolean>; // Track which conversations are being deleted

    // Error states
    error: string | null;
    retryCount: number;

    // Tasks tracking (operations in progress)
    pendingTasks: Record<string, boolean>;
    initialized: boolean;

    // Actions
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
}

/**
 * Generate a unique ID for messages
 */
function generateMessageId(): string {
    return generateSessionId();
}

/**
 * Safely handle localStorage operations with error handling
 */
const safeLocalStorage = {
    getItem: (key: string): string | null => {
        try {
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem(key);
            }
        } catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
        }
        return null;
    },

    setItem: (key: string, value: string): void => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } catch (error) {
            console.error(`Error writing to localStorage: ${key}`, error);
        }
    },

    removeItem: (key: string): void => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`Error removing from localStorage: ${key}`, error);
        }
    },
};

/**
 * Main chat store with both state and actions
 */
export const useChatStore = create<ChatState>()(
    immer((set, get) => ({
        // Initial state
        messages: [],
        isLoading: false,
        isStreaming: false,
        currentStreamContent: '',
        abortController: null,
        sessionId: null,
        conversations: [],
        loadingConversations: false,
        deletingConversations: {},
        pendingTasks: {},
        error: null,
        retryCount: 0,
        initialized: false,

        // Actions that modify state
        _addMessage: (message) =>
            set((state) => {
                state.messages.push(message);
            }),

        _updateLastBotMessage: (content) =>
            set((state) => {
                const lastIndex = state.messages.length - 1;
                if (lastIndex >= 0) {
                    state.messages[lastIndex].content = content;
                }
            }),

        _setLoading: (isLoading) =>
            set((state) => {
                state.isLoading = isLoading;
            }),

        _setStreaming: (isStreaming) =>
            set((state) => {
                state.isStreaming = isStreaming;
            }),

        _setStreamContent: (content) =>
            set((state) => {
                state.currentStreamContent = content;

                // Also update the message in the messages array
                const lastIndex = state.messages.length - 1;
                if (lastIndex >= 0 && state.messages[lastIndex].sender === 'bot') {
                    state.messages[lastIndex].content = content;
                }
            }),

        _setAbortController: (controller) =>
            set((state) => {
                state.abortController = controller;
            }),

        _setSessionId: (sessionId) =>
            set((state) => {
                state.sessionId = sessionId;

                // Store in localStorage if not null
                if (sessionId) {
                    safeLocalStorage.setItem('chat_session_id', sessionId);
                }
            }),

        _setConversations: (conversations) =>
            set((state) => {
                state.conversations = conversations;
            }),

        _setLoadingConversations: (loading) =>
            set((state) => {
                state.loadingConversations = loading;
            }),

        _setDeletingConversation: (sessionId, isDeleting) =>
            set((state) => {
                if (isDeleting) {
                    state.deletingConversations[sessionId] = true;
                } else {
                    delete state.deletingConversations[sessionId];
                }
            }),

        _setError: (error) =>
            set((state) => {
                state.error = error;
            }),

        _setPendingTask: (taskId, isPending) =>
            set((state) => {
                if (isPending) {
                    state.pendingTasks[taskId] = true;
                } else {
                    delete state.pendingTasks[taskId];
                }
            }),

        _setInitialized: (initialized) =>
            set((state) => {
                state.initialized = initialized;
            }),

        // Load all conversations
        loadAllConversations: async () => {
            const taskId = 'load-all-conversations';
            const state = get();

            // Don't start another load if one is already in progress
            if (state.loadingConversations || state.pendingTasks[taskId]) {
                return;
            }

            set((state) => {
                state.loadingConversations = true;
                state.pendingTasks[taskId] = true;
                state.error = null;
            });

            try {
                // Use task queue for this operation
                await new Promise<void>((resolve, reject) => {
                    enqueueTask(
                        taskId,
                        async () => {
                            try {
                                const allConversations = await getAllConversations();
                                set((state) => {
                                    state.conversations = allConversations;
                                    state.loadingConversations = false;
                                    delete state.pendingTasks[taskId];
                                });
                                resolve();
                            } catch (error) {
                                console.error('Error loading conversations:', error);
                                reject(error);
                            }
                        },
                        {
                            priority: 2, // Higher priority
                            onError: (error) => {
                                set((state) => {
                                    state.loadingConversations = false;
                                    delete state.pendingTasks[taskId];
                                    state.error = error.message;
                                });
                                console.error('Failed to load conversations:', error);
                            },
                        },
                    );
                });
            } catch (error) {
                // Error already handled in task
            }
        },

        // Load a specific conversation
        refreshConversation: async () => {
            const state = get();
            const { sessionId } = state;

            if (!sessionId) return;

            const taskId = `refresh-conversation-${sessionId}`;

            // Don't start another load if one is already in progress
            if (state.isLoading || state.pendingTasks[taskId]) {
                return;
            }

            set((state) => {
                state.isLoading = true;
                state.pendingTasks[taskId] = true;
                state.error = null;
            });

            try {
                await new Promise<void>((resolve, reject) => {
                    enqueueTask(
                        taskId,
                        async () => {
                            try {
                                const history = await getConversationHistory(sessionId);

                                // Convert history to message format
                                if (history && history.history && Array.isArray(history.history)) {
                                    const formattedMessages = history.history.map((msg: any) => ({
                                        id: generateMessageId(),
                                        content: msg.content,
                                        sender: msg.role === 'user' ? 'user' : 'bot',
                                        timestamp: new Date(msg.created_at || Date.now()),
                                        error: false,
                                    }));

                                    set((state) => {
                                        state.messages = formattedMessages;
                                        state.isLoading = false;
                                        delete state.pendingTasks[taskId];
                                    });
                                }

                                // Also refresh conversation list to ensure UI is in sync
                                get().loadAllConversations();
                                resolve();
                            } catch (error) {
                                console.error('Error loading conversation:', error);
                                reject(error);
                            }
                        },
                        {
                            onError: (error) => {
                                set((state) => {
                                    state.isLoading = false;
                                    delete state.pendingTasks[taskId];
                                    state.error = error.message;

                                    // If we can't load this conversation, it might be deleted
                                    // Create a new one to avoid UI getting stuck
                                    if (state.conversations.length === 0) {
                                        // Ensure we have a session ID and clear messages
                                        const newSessionId = generateSessionId();
                                        state.sessionId = newSessionId;
                                        state.messages = [];
                                        safeLocalStorage.setItem('chat_session_id', newSessionId);
                                    }
                                });
                            },
                        },
                    );
                });
            } catch (error) {
                // Error already handled in task
            }
        },

        // Send a message to the LLM API
        sendMessage: async (message) => {
            const state = get();

            if (!message.trim() || state.isLoading) {
                return;
            }

            // Ensure we have a session ID
            const currentSessionId = state.sessionId || generateSessionId();
            if (!state.sessionId) {
                get()._setSessionId(currentSessionId);
            }

            // Create a new user message
            const userMessage: ChatMessage = {
                id: generateMessageId(),
                content: message,
                sender: 'user',
                timestamp: new Date(),
            };

            // Add user message to chat
            get()._addMessage(userMessage);
            get()._setLoading(true);
            get()._setError(null);

            try {
                // Create abort controller for the request
                const abortController = new AbortController();
                get()._setAbortController(abortController);

                // Start streaming
                get()._setStreaming(true);
                get()._setStreamContent('');

                // Add placeholder for bot response
                const responsePlaceholder: ChatMessage = {
                    id: generateMessageId(),
                    content: '',
                    sender: 'bot',
                    timestamp: new Date(),
                };

                get()._addMessage(responsePlaceholder);

                // Stream handler for updating content as it arrives
                const handleStreamChunk = (chunk: string) => {
                    get()._setStreamContent(get().currentStreamContent + chunk);
                };

                // Make the API request with the stream handler
                const response = await generateLLMResponse(message, currentSessionId, true, handleStreamChunk);

                // If we received a session ID from the API response, update our state
                // This handles the case when backend creates a new conversation
                if (response && response.session_id && (!state.sessionId || state.messages.length <= 2)) {
                    get()._setSessionId(response.session_id);
                }

                // Stream should be complete by now, but ensure final state is updated
                if (response && (response.response || typeof response.response === 'string')) {
                    const finalContent = response.response || '';
                    get()._updateLastBotMessage(finalContent);
                    get()._setStreamContent(finalContent);
                }

                // Refresh conversation list after sending a message
                setTimeout(() => get().loadAllConversations(), 500);
            } catch (error) {
                console.error('Error sending message:', error);

                // Update last message to show error
                const lastIndex = state.messages.length - 1;
                if (lastIndex >= 0) {
                    set((state) => {
                        state.messages[lastIndex] = {
                            ...state.messages[lastIndex],
                            content:
                                error instanceof Error
                                    ? error.message
                                    : 'An error occurred while processing your request.',
                            error: true,
                            isRetryable: true,
                        };

                        state.error = error instanceof Error ? error.message : 'Unknown error';
                    });
                }
            } finally {
                get()._setLoading(false);
                get()._setStreaming(false);
                get()._setAbortController(null);
            }
        },

        // Retry sending a failed message
        handleRetry: (index) => {
            const state = get();
            const { messages } = state;

            if (index < 0 || index >= messages.length) return;

            const messageToRetry = messages[index];
            if (messageToRetry.sender !== 'user') return;

            // Remove the failed bot response message
            set((state) => {
                state.messages = state.messages.slice(0, index + 1);
                state.retryCount = state.retryCount + 1;
            });

            // Resend the user message
            get().sendMessage(messageToRetry.content);
        },

        // Cancel an in-progress response
        cancelResponse: () => {
            const state = get();

            if (state.abortController) {
                state.abortController.abort();
                get()._setAbortController(null);
            }

            get()._setLoading(false);
            get()._setStreaming(false);

            // Remove the last message if it's a bot message being generated
            const lastIndex = state.messages.length - 1;
            if (
                lastIndex >= 0 &&
                state.messages[lastIndex].sender === 'bot' &&
                state.messages[lastIndex].content === ''
            ) {
                set((state) => {
                    state.messages = state.messages.slice(0, -1);
                });
            }
        },

        // Switch to a different conversation
        switchConversation: async (sid) => {
            const state = get();

            if (state.isLoading || sid === state.sessionId) return;

            // Clear any errors when switching conversations
            get()._setError(null);
            get()._setSessionId(sid);

            // Load the conversation history
            await get().refreshConversation();
        },

        // Delete a conversation
        deleteConversationById: async (sid) => {
            const state = get();

            if (state.isLoading || state.deletingConversations[sid]) return;

            // Mark as deleting to prevent duplicate deletes
            get()._setDeletingConversation(sid, true);
            get()._setError(null);

            try {
                // Use the task queue for this operation
                await new Promise<void>((resolve, reject) => {
                    enqueueTask(
                        `delete-conversation-${sid}`,
                        async () => {
                            try {
                                await deleteConversation(sid);

                                // Update conversations list immediately in UI
                                set((state) => {
                                    state.conversations = state.conversations.filter((conv) => conv.id !== sid);
                                    delete state.deletingConversations[sid];
                                });

                                // If we deleted the current conversation, create a new one
                                if (sid === get().sessionId) {
                                    const newSessionId = generateSessionId();
                                    get()._setSessionId(newSessionId);
                                    set((state) => {
                                        state.messages = [];
                                    });
                                }

                                resolve();
                            } catch (error) {
                                console.error('Error deleting conversation:', error);
                                reject(error);
                            }
                        },
                        {
                            onError: (error) => {
                                // Clean up deleting state even on error
                                get()._setDeletingConversation(sid, false);
                                get()._setError(`Failed to delete: ${error.message}`);

                                // If there's an error and this was the current conversation,
                                // ensure we still have a valid state
                                if (sid === get().sessionId && get().conversations.length === 0) {
                                    const newSessionId = generateSessionId();
                                    get()._setSessionId(newSessionId);
                                    set((state) => {
                                        state.messages = [];
                                    });
                                }
                            },
                        },
                    );
                });
            } catch (error) {
                console.error('Error in delete conversation task:', error);
            }
        },

        // Create a new conversation
        newChat: async () => {
            const state = get();

            if (state.isLoading) return;

            // Clear any errors when creating a new chat
            get()._setError(null);

            // Create a new session
            const newSessionId = generateSessionId();
            get()._setSessionId(newSessionId);

            // Clear messages
            set((state) => {
                state.messages = [];
            });

            // Refresh conversation list to capture any pending updates
            await get().loadAllConversations();
        },
    })),
);

/**
 * Initialize the chat store by loading the saved session ID and conversations
 * Call this once during app initialization
 */
export function initializeChatStore() {
    const store = useChatStore.getState();

    // Check if already initialized to avoid duplicate initialization
    if (store.initialized) {
        return () => {};
    }

    // Try to load session ID from localStorage
    const savedSessionId = safeLocalStorage.getItem('chat_session_id');

    if (savedSessionId) {
        store._setSessionId(savedSessionId);

        // Only load conversation history for existing sessions that were previously saved
        // This prevents making API calls for freshly generated session IDs with no history
        store
            .loadAllConversations()
            .then(() => {
                // Check if this session ID exists in the loaded conversations
                const currentState = useChatStore.getState();
                const sessionExists = currentState.conversations.some(
                    (conv: ConversationSummary) => conv.id === savedSessionId,
                );

                // Only load the conversation history if this session actually exists
                if (sessionExists) {
                    store.refreshConversation().catch(() => {
                        // If loading fails, generate a new session ID
                        const newSessionId = generateSessionId();
                        store._setSessionId(newSessionId);
                        store._setError("Couldn't load conversation history. Starting a new chat.");
                    });
                }
            })
            .catch((err) => {
                console.error('Failed to check if conversation exists:', err);
            });
    } else {
        // Create a new session ID if none exists
        const newSessionId = generateSessionId();
        store._setSessionId(newSessionId);
        // Don't load conversation history for a new session ID as it won't exist yet
    }

    // Mark as initialized
    store._setInitialized(true);

    return () => {};
}
