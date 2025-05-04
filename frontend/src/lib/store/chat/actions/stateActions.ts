import { StateCreator } from 'zustand';
import { FullChatStore, ConversationSummary } from '../types';
import { SESSION_ID_KEY, safeStorage } from '../utils/messageUtils';
import { dbService } from '../services/dbService';

/**
 * Type definition for state-related actions
 */
type StateActions = {
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
};

/**
 * Actions for updating basic state properties in the chat store
 */
export const createStateActions: StateCreator<FullChatStore, [['zustand/immer', never]], [], StateActions> = (
    set,
    get,
) => ({
    _setLoading: (isLoading: boolean) =>
        set((state) => {
            state.isLoading = isLoading;
            return state;
        }),

    _setStreaming: (isStreaming: boolean) =>
        set((state) => {
            state.isStreaming = isStreaming;
            return state;
        }),

    _setStreamContent: (content: string) =>
        set((state) => {
            state.currentStreamContent = content;

            // Also update the message in the messages array
            const lastIndex = state.messages.length - 1;
            if (lastIndex >= 0 && state.messages[lastIndex].sender === 'bot') {
                state.messages[lastIndex].content = content;

                // Update in IndexedDB but throttle to avoid excessive writes
                if (state.sessionId && state.messages[lastIndex].id) {
                    const messageId = state.messages[lastIndex].id;
                    const sessionId = state.sessionId;

                    // Use a debounced approach to avoid writing on every chunk
                    if (!get()._streamUpdateTimeoutId) {
                        const timeoutId = setTimeout(() => {
                            dbService
                                .updateMessage(sessionId, messageId, content)
                                .catch((err) => console.error('Failed to update streamed message:', err));
                            set((state) => {
                                state._streamUpdateTimeoutId = null;
                                return state;
                            });
                        }, 300);

                        state._streamUpdateTimeoutId = timeoutId;
                    }
                }
            }

            return state;
        }),

    _setAbortController: (controller: AbortController | null) =>
        set((state) => {
            state.abortController = controller;
            return state;
        }),

    _setSessionId: (sessionId: string | null) =>
        set((state) => {
            state.sessionId = sessionId;

            // Store in localStorage as a backup/fallback
            if (sessionId) {
                safeStorage.setItem(SESSION_ID_KEY, sessionId);
            } else {
                safeStorage.removeItem(SESSION_ID_KEY);
            }

            return state;
        }),

    _setConversations: (conversations: ConversationSummary[]) =>
        set((state) => {
            state.conversations = conversations;

            // Batch save to IndexedDB
            dbService
                .saveConversations(conversations)
                .catch((err) => console.error('Failed to save conversations to IndexedDB:', err));

            return state;
        }),

    _setLoadingConversations: (loading: boolean) =>
        set((state) => {
            state.loadingConversations = loading;
            return state;
        }),

    _setDeletingConversation: (sessionId: string, isDeleting: boolean) =>
        set((state) => {
            if (isDeleting) {
                state.deletingConversations[sessionId] = true;
            } else {
                delete state.deletingConversations[sessionId];
            }
            return state;
        }),

    _setError: (error: string | null) =>
        set((state) => {
            state.error = error;
            return state;
        }),

    _setPendingTask: (taskId: string, isPending: boolean) =>
        set((state) => {
            if (isPending) {
                state.pendingTasks[taskId] = true;
            } else {
                delete state.pendingTasks[taskId];
            }
            return state;
        }),

    _setInitialized: (initialized: boolean) =>
        set((state) => {
            state.initialized = initialized;
            return state;
        }),
});
