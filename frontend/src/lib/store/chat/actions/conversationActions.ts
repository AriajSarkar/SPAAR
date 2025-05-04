import { StateCreator } from 'zustand';
import { FullChatStore, ConversationSummary } from '../types';
import { apiService } from '../services/apiService';
import { dbService } from '../services/dbService';
import { enqueueTask } from '@/lib/utils/taskQueue';
import { generateMessageId } from '../utils/messageUtils';

/**
 * Type definition for conversation-related actions
 */
type ConversationActions = {
    _addOrUpdateConversation: (sessionId: string, title?: string, shouldPersist?: boolean) => void;
    _setConversations: (conversations: ConversationSummary[]) => void;
    _setLoadingConversations: (loading: boolean) => void;
    _setDeletingConversation: (sessionId: string, isDeleting: boolean) => void;
    loadAllConversations: () => Promise<void>;
    refreshConversation: () => Promise<void>;
    switchConversation: (sessionId: string) => Promise<void>;
    deleteConversationById: (sessionId: string) => Promise<void>;
    newChat: () => Promise<void>;
};

/**
 * Actions for handling conversation operations in the chat store
 */
export const createConversationActions: StateCreator<
    FullChatStore,
    [['zustand/immer', never]],
    [],
    ConversationActions
> = (set, get) => ({
    /**
     * Add or update a conversation in the local state and IndexedDB
     * @param sessionId The session ID
     * @param title Optional title for the conversation
     * @param shouldPersist Whether to save to IndexedDB (default: false)
     */
    _addOrUpdateConversation: (sessionId: string, title = 'New conversation', shouldPersist = false) =>
        set((state) => {
            // Check if conversation already exists
            const existingIndex = state.conversations.findIndex((conv) => conv.id === sessionId);
            const now = new Date().toISOString();
            let updatedConversation;

            if (existingIndex >= 0) {
                // Update existing conversation
                updatedConversation = {
                    ...state.conversations[existingIndex],
                    title: title || state.conversations[existingIndex].title,
                    updatedAt: now,
                    lastMessageDate: now,
                };
                state.conversations[existingIndex] = updatedConversation;
            } else {
                // Add new conversation with complete metadata
                updatedConversation = {
                    id: sessionId,
                    title,
                    createdAt: now,
                    updatedAt: now,
                    lastMessageDate: now,
                    preview: 'No messages yet',
                    messageCount: 0,
                };
                state.conversations.unshift(updatedConversation);
            }

            // Sort by lastMessageDate (newest first)
            state.conversations.sort((a, b) => {
                const dateA = a.lastMessageDate
                    ? new Date(a.lastMessageDate).getTime()
                    : new Date(a.updatedAt).getTime();
                const dateB = b.lastMessageDate
                    ? new Date(b.lastMessageDate).getTime()
                    : new Date(b.updatedAt).getTime();
                return dateB - dateA;
            });

            // Only save to IndexedDB if explicitly requested (has messages or from API)
            if (shouldPersist) {
                dbService
                    .saveConversation(updatedConversation)
                    .catch((err) => console.error('Failed to save conversation to IndexedDB:', err));
            }

            return state; // Return modified state
        }),

    // State updaters
    _setConversations: (conversations: ConversationSummary[]) =>
        set((state) => {
            state.conversations = conversations;
            return state; // Return modified state
        }),

    _setLoadingConversations: (loading: boolean) =>
        set((state) => {
            state.loadingConversations = loading;
            return state; // Return modified state
        }),

    _setDeletingConversation: (sessionId: string, isDeleting: boolean) =>
        set((state) => {
            if (isDeleting) {
                state.deletingConversations[sessionId] = true;
            } else {
                delete state.deletingConversations[sessionId];
            }
            return state; // Return modified state
        }),

    // Load all conversations - optimized with parallel loading and timeouts
    loadAllConversations: async (): Promise<void> => {
        const taskId = 'load-all-conversations';
        const state = get();

        // Skip if another load is already in progress
        if (state.loadingConversations || state.pendingTasks[taskId]) {
            return;
        }

        set((state) => {
            state.loadingConversations = true;
            state.pendingTasks[taskId] = true;
            state.error = null;
            return state;
        });

        try {
            // Only fetch conversations from the API first
            // We'll only store to IndexedDB if they have actual content
            const apiPromise = new Promise<ConversationSummary[]>((resolve, reject) => {
                // Use task queue with high priority
                enqueueTask(
                    taskId + '-api',
                    async () => {
                        try {
                            // Add timeout to the API call to prevent hanging
                            const formattedConversations = await Promise.race([
                                apiService.getAllConversations(),
                                new Promise<never>((_, timeoutReject) =>
                                    setTimeout(() => timeoutReject(new Error('API request timed out')), 10000),
                                ),
                            ]);
                            resolve(formattedConversations);
                        } catch (error) {
                            console.error('Error loading conversations from API:', error);
                            reject(error);
                        }
                    },
                    { priority: 1 },
                );
            });

            try {
                // Wait for API conversations - these should have actual content
                const apiConversations = await apiPromise;

                // Only update state and IndexedDB if we got valid conversations from API
                if (apiConversations && apiConversations.length > 0) {
                    // Update state with data from API
                    set((state) => {
                        state.conversations = apiConversations;
                        state.loadingConversations = false;
                        delete state.pendingTasks[taskId];
                        return state;
                    });

                    // Store API conversations in IndexedDB (these should have actual content)
                    // This is a background operation - we don't need to wait for it
                    dbService
                        .saveConversations(apiConversations)
                        .catch((err) => console.error('Failed to sync conversations to IndexedDB:', err));
                } else {
                    // If no conversations from API, check local storage as fallback
                    const localConversations = await dbService.getAllConversations();

                    set((state) => {
                        // Only use local conversations if they exist and contain valid data
                        const validLocalConversations = localConversations.filter(
                            (conv) =>
                                (conv.messageCount !== undefined && conv.messageCount > 0) ||
                                conv.preview !== 'No messages yet',
                        );

                        state.conversations = validLocalConversations;
                        state.loadingConversations = false;
                        delete state.pendingTasks[taskId];
                        return state;
                    });
                }
            } catch (error) {
                console.warn('Error fetching conversations from API:', error);

                // Fallback to locally cached conversations
                const localConversations = await dbService.getAllConversations();

                // Filter out any empty conversations that might have been stored previously
                const validLocalConversations = localConversations.filter(
                    (conv) =>
                        (conv.messageCount !== undefined && conv.messageCount > 0) ||
                        conv.preview !== 'No messages yet',
                );

                if (validLocalConversations && validLocalConversations.length > 0) {
                    set((state) => {
                        state.conversations = validLocalConversations;
                        state.loadingConversations = false;
                        delete state.pendingTasks[taskId];
                        return state;
                    });
                } else {
                    // If no valid conversations anywhere, just finish loading
                    set((state) => {
                        state.conversations = [];
                        state.loadingConversations = false;
                        delete state.pendingTasks[taskId];
                        return state;
                    });
                }
            }
        } catch (error) {
            // Error with IndexedDB or other fatal error
            console.error('Fatal error accessing storage:', error);

            set((state) => {
                state.loadingConversations = false;
                delete state.pendingTasks[taskId];
                state.error = error instanceof Error ? error.message : 'Failed to access storage';
                return state;
            });
        }
    },

    // Load a specific conversation with optimized loading and timeout handling
    refreshConversation: async () => {
        const state = get();
        const { sessionId } = state;

        if (!sessionId) return;

        const taskId = `refresh-conversation-${sessionId}`;

        // Skip if already loading
        if (state.isLoading || state.pendingTasks[taskId]) {
            return;
        }

        set((state) => {
            state.isLoading = true;
            state.pendingTasks[taskId] = true;
            state.error = null;
            return state;
        });

        try {
            // Start IndexedDB and API requests in parallel for maximum speed
            const localPromise = dbService.getMessages(sessionId);

            // Start API request immediately without waiting for IndexedDB
            const apiPromise = new Promise<{
                history: Record<string, unknown>[];
                title?: string;
            }>((resolve, reject) => {
                enqueueTask(
                    taskId + '-api',
                    async () => {
                        try {
                            // Add timeout to API call
                            const history = await Promise.race([
                                apiService.getConversationHistory(sessionId),
                                new Promise<never>((_, timeoutReject) =>
                                    setTimeout(() => timeoutReject(new Error('API request timed out')), 8000),
                                ),
                            ]);
                            resolve(history);
                        } catch (error) {
                            console.error('Error loading conversation history from API:', error);
                            reject(error);
                        }
                    },
                    { priority: 1 },
                );
            });

            // Wait for IndexedDB result first (should be fast)
            const localMessages = await localPromise;

            // If we have local messages, show them immediately
            if (localMessages && localMessages.length > 0) {
                set((state) => {
                    state.messages = localMessages;
                    // Keep loading flag true since we're still waiting for API
                    return state;
                });
            }

            // Then await API result with error handling
            try {
                const history = await apiPromise;

                if (history && history.history && Array.isArray(history.history)) {
                    const formattedMessages = history.history.map((msg: Record<string, unknown>) => ({
                        id: generateMessageId(),
                        content: typeof msg.content === 'string' ? msg.content : '',
                        sender: (msg.role === 'user' ? 'user' : 'bot') as 'user' | 'bot',
                        timestamp: new Date(msg.created_at ? String(msg.created_at) : Date.now()),
                        error: false,
                    }));

                    set((state) => {
                        state.messages = formattedMessages;
                        state.isLoading = false;
                        delete state.pendingTasks[taskId];
                        return state;
                    });

                    // Update conversation title if provided
                    if (history.title) {
                        get()._addOrUpdateConversation(sessionId, history.title);
                    }

                    // Update preview and messageCount if this is a new session
                    const existingConversation = state.conversations.find((conv) => conv.id === sessionId);
                    if (
                        existingConversation &&
                        (!existingConversation.preview || existingConversation.preview === 'No messages yet')
                    ) {
                        // Find first user message for preview
                        const firstUserMsg = formattedMessages.find((msg) => msg.sender === 'user');
                        if (firstUserMsg) {
                            get()._addOrUpdateConversation(
                                sessionId,
                                existingConversation.title || history.title || 'New conversation',
                            );
                        }
                    }

                    // Save messages to IndexedDB as a background task
                    Promise.all(formattedMessages.map((msg) => dbService.saveMessage(sessionId, msg))).catch((err) =>
                        console.error('Failed to save messages to IndexedDB:', err),
                    );
                } else {
                    // If API returned empty history, ensure we handle finishing the loading state
                    set((state) => {
                        state.isLoading = false;
                        delete state.pendingTasks[taskId];
                        return state;
                    });
                }
            } catch (error) {
                console.warn('Using locally cached messages due to API error:', error);

                // If we already have local data, consider it a success
                if (localMessages && localMessages.length > 0) {
                    set((state) => {
                        state.isLoading = false;
                        delete state.pendingTasks[taskId];
                        return state;
                    });
                } else {
                    // Only show error if we don't have local data
                    set((state) => {
                        state.isLoading = false;
                        delete state.pendingTasks[taskId];
                        state.error = error instanceof Error ? error.message : 'Failed to load conversation';

                        // If we can't load this conversation, create a new one
                        if (state.conversations.length === 0) {
                            const newSessionId = apiService.generateSessionId();
                            state.sessionId = newSessionId;
                            state.messages = [];

                            // Add optimistic entry for the new conversation
                            get()._addOrUpdateConversation(newSessionId);
                        }

                        return state;
                    });
                }
            }
        } catch (error) {
            // Error accessing IndexedDB
            console.error('Error accessing IndexedDB for messages:', error);

            set((state) => {
                state.isLoading = false;
                delete state.pendingTasks[taskId];
                state.error = error instanceof Error ? error.message : 'Failed to access local message storage';
                return state;
            });
        }
    },

    // Switch to a different conversation
    switchConversation: async (sid: string) => {
        const state = get();

        if (state.isLoading || sid === state.sessionId) return;

        get()._setError(null);
        get()._setSessionId(sid);

        // Clear messages while loading
        set((state) => {
            state.messages = [];
            return state;
        });

        await get().refreshConversation();
    },

    // Delete a conversation
    deleteConversationById: async (sid: string) => {
        const state = get();

        if (state.isLoading || state.deletingConversations[sid]) return;

        get()._setDeletingConversation(sid, true);
        get()._setError(null);

        // Optimistically remove from UI
        set((state) => {
            state.conversations = state.conversations.filter((conv) => conv.id !== sid);
            return state;
        });

        // Delete from IndexedDB immediately
        dbService
            .deleteConversation(sid)
            .catch((err) => console.error('Failed to delete conversation from IndexedDB:', err));

        // Also delete from the server
        try {
            await new Promise<void>((resolve) => {
                enqueueTask(
                    `delete-conversation-${sid}`,
                    async () => {
                        try {
                            await apiService.deleteConversation(sid);

                            set((state) => {
                                delete state.deletingConversations[sid];
                                return state;
                            });

                            // If we deleted the current conversation, create a new one
                            if (sid === get().sessionId) {
                                get()._setSessionId(null);
                                set((state) => {
                                    state.messages = [];
                                    return state;
                                });
                                await get().newChat();
                            }

                            resolve();
                        } catch (error) {
                            console.error('Error deleting conversation from server:', error);

                            // Server delete failed, but we've already removed from IndexedDB
                            // Don't reject since the user's goal of removing the conversation is achieved
                            set((state) => {
                                delete state.deletingConversations[sid];
                                return state;
                            });

                            // If this was the current conversation, ensure we have a valid state
                            if (sid === get().sessionId) {
                                get()._setSessionId(null);
                                set((state) => {
                                    state.messages = [];
                                    return state;
                                });
                                await get().newChat();
                            }

                            resolve();
                        }
                    },
                    {
                        priority: 1,
                        onError: (error: Error) => {
                            get()._setDeletingConversation(sid, false);
                            get()._setError(`Failed to sync deletion: ${error.message}`);

                            // If this was the current conversation, ensure we have a valid state
                            if (sid === get().sessionId && get().conversations.length === 0) {
                                get().newChat();
                            }
                        },
                    },
                );
            });
        } catch {
            // Error already handled in task
        }
    },

    // Create a new conversation - without generating a session ID until needed
    newChat: async () => {
        const state = get();

        if (state.isLoading) return;

        get()._setError(null);

        // Just clear the current session ID and messages
        // We'll only generate a real session ID when the user sends a message
        get()._setSessionId(null);

        set((state) => {
            state.messages = [];
            return state;
        });
    },
});
