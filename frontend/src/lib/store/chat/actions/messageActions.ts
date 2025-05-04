import { StateCreator } from 'zustand';
import { ChatMessage, FullChatStore } from '../types';
import { generateMessageId } from '../utils/messageUtils';
import { apiService } from '../services/apiService';
import { dbService } from '../services/dbService';

/**
 * Type definition for message-related actions
 */
type MessageActions = {
    _addMessage: (message: ChatMessage) => void;
    _updateLastBotMessage: (content: string) => void;
    sendMessage: (message: string) => Promise<void>;
    handleRetry: (index: number) => void;
    cancelResponse: () => void;
};

/**
 * Actions for handling message operations in the chat store
 */
export const createMessageActions: StateCreator<FullChatStore, [['zustand/immer', never]], [], MessageActions> = (
    set,
    get,
) => ({
    _addMessage: (message: ChatMessage) =>
        set((state) => {
            state.messages.push(message);

            // Also save to IndexedDB if we have a session ID
            if (state.sessionId) {
                dbService
                    .saveMessage(state.sessionId, message)
                    .catch((err) => console.error('Failed to save message to IndexedDB:', err));
            }

            return state; // Return modified state
        }),

    _updateLastBotMessage: (content: string) =>
        set((state) => {
            const lastIndex = state.messages.length - 1;
            if (lastIndex >= 0) {
                state.messages[lastIndex].content = content;

                // Also update in IndexedDB
                if (state.sessionId) {
                    dbService
                        .updateMessage(state.sessionId, state.messages[lastIndex].id, content)
                        .catch((err) => console.error('Failed to update message in IndexedDB:', err));
                }
            }

            return state; // Return modified state
        }),

    // Send a message to the LLM API
    sendMessage: async (message: string) => {
        const state = get();

        if (!message.trim() || state.isLoading) {
            return;
        }

        // Only generate a session ID when actually sending a message
        // This prevents creating unused sessionIDs when clicking "New Chat"
        const currentSessionId = state.sessionId || apiService.generateSessionId();

        // Set the session ID in the state
        if (!state.sessionId) {
            get()._setSessionId(currentSessionId);
            // Note: We don't add this to the conversations list yet - it stays in memory only
        }

        // Add user message immediately for better UX
        const userMessage: ChatMessage = {
            id: generateMessageId(),
            content: message,
            sender: 'user',
            timestamp: new Date(),
        };

        get()._addMessage(userMessage);
        get()._setLoading(true);
        get()._setError(null);

        // For temporary display in the UI - don't persist yet
        const truncatedTitle = message.length > 40 ? `${message.substring(0, 37)}...` : message;

        try {
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

            // Stream handler for updating content
            const handleStreamChunk = (chunk: string) => {
                if (get().abortController === abortController) {
                    get()._setStreamContent(get().currentStreamContent + chunk);
                }
            };

            // Make the API request in non-blocking way
            await new Promise<void>((resolve, reject) => {
                // Use a microtask to avoid blocking UI
                queueMicrotask(async () => {
                    try {
                        const response = await apiService.generateLLMResponse(
                            message,
                            currentSessionId,
                            true,
                            handleStreamChunk,
                        );

                        // Handle session ID from response
                        if (response && response.session_id) {
                            const responseSessionId = String(response.session_id);
                            get()._setSessionId(responseSessionId);

                            // If backend returned a different session ID
                            if (responseSessionId !== currentSessionId) {
                                // Update with the new session ID - now we can persist since we have API data
                                get()._addOrUpdateConversation(
                                    responseSessionId,
                                    typeof response.title === 'string' ? response.title : truncatedTitle,
                                    true, // Now persist to IndexedDB since we have an API response
                                );
                            } else {
                                // Same session ID, now persist with API-confirmed conversation
                                get()._addOrUpdateConversation(
                                    responseSessionId,
                                    typeof response.title === 'string' ? response.title : truncatedTitle,
                                    true, // Now persist to IndexedDB since we have an API response
                                );
                            }
                        }

                        // Update message with final response
                        if (response && response.response !== undefined) {
                            const finalContent = typeof response.response === 'string' ? response.response : '';
                            get()._updateLastBotMessage(finalContent);
                            get()._setStreamContent(finalContent);
                        }

                        resolve();
                    } catch (error) {
                        console.error('Error sending message:', error);

                        // Update last message as error
                        const lastIndex = get().messages.length - 1;
                        if (lastIndex >= 0) {
                            set((state) => {
                                const errorContent =
                                    error instanceof Error
                                        ? error.message
                                        : 'An error occurred while processing your request.';

                                state.messages[lastIndex] = {
                                    ...state.messages[lastIndex],
                                    content: errorContent,
                                    error: true,
                                    isRetryable: true,
                                };

                                state.error = error instanceof Error ? error.message : 'Unknown error';
                                return state;
                            });
                        }

                        reject(error);
                    } finally {
                        get()._setLoading(false);
                        get()._setStreaming(false);
                        get()._setAbortController(null);
                    }
                });
            });
        } catch {
            // Error already handled in the promise
        }
    },

    // Retry sending a failed message
    handleRetry: (index: number) => {
        const state = get();
        const { messages } = state;

        if (index < 0 || index >= messages.length) return;

        const messageToRetry = messages[index];
        if (messageToRetry.sender !== 'user') return;

        set((state) => {
            state.messages = state.messages.slice(0, index + 1);
            state.retryCount = state.retryCount + 1;

            // Clean up any extra messages in IndexedDB
            if (state.sessionId) {
                // This is a best-effort cleanup, don't block UI on it
                const sessionId = state.sessionId;
                const messagesToKeep = state.messages;

                dbService
                    .getMessages(sessionId)
                    .then((allMessages) => {
                        const messagesToDelete = allMessages.filter(
                            (msg) => !messagesToKeep.some((keepMsg: ChatMessage) => keepMsg.id === msg.id),
                        );

                        // No clean way to batch delete with specific IDs in Dexie
                        // This is a simplified approach
                        if (messagesToDelete.length > 0) {
                            // For now, just log that we would delete these
                            console.log(`Would delete ${messagesToDelete.length} messages`);

                            // Implementation would depend on specific DB methods available
                            // This is a placeholder for that implementation
                        }
                    })
                    .catch(console.error);
            }

            return state;
        });

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
        if (lastIndex >= 0 && state.messages[lastIndex].sender === 'bot' && state.messages[lastIndex].content === '') {
            set((state) => {
                // Get the ID before removing it
                const messageId = state.messages[lastIndex].id;

                // Remove from state
                state.messages = state.messages.slice(0, -1);

                // Also remove from IndexedDB if we have a session
                if (state.sessionId && messageId) {
                    dbService
                        .deleteMessage(state.sessionId, messageId)
                        .catch((err) => console.error('Failed to delete canceled message:', err));
                }

                return state;
            });
        }
    },
});
