'use client';

import { useEffect, useCallback } from 'react';
import { useChatStore, initializeChatStore, ChatMessage, MessageSender } from '@/lib/store/chatStore';

// Re-export types from store
export type { ChatMessage, MessageSender };

/**
 * Custom hook for chat functionality with session management
 * This is a wrapper around the Zustand store to provide a React hook interface
 */
export function useChat() {
    // Get state and actions from the store
    const {
        messages,
        isLoading,
        isStreaming,
        currentStreamContent,
        sessionId,
        conversations,
        loadingConversations,
        deletingConversations,
        error,
        initialized,
        sendMessage,
        handleRetry,
        cancelResponse,
        switchConversation,
        deleteConversationById,
        newChat,
        refreshConversation,
        loadAllConversations,
    } = useChatStore();

    // Initialize the chat store on first load
    useEffect(() => {
        // Initialize store with saved session ID and load conversations
        const cleanup = initializeChatStore();
        return cleanup;
    }, []);

    // Create a memoized wrapper for sendMessage that also refreshes conversations
    const enhancedSendMessage = useCallback(
        (content: string) => {
            const result = sendMessage(content);
            // After sending a message, refresh conversations to get the latest data
            // without using a continuous polling approach
            setTimeout(() => {
                if (!isLoading && !isStreaming) {
                    loadAllConversations();
                }
            }, 1000); // Short delay to ensure server has processed the message
            return result;
        },
        [sendMessage, loadAllConversations, isLoading, isStreaming],
    );

    // Return everything needed by components
    return {
        // State
        messages,
        isLoading,
        isStreaming,
        currentStreamContent,
        sessionId,
        conversations,
        loadingConversations,
        deletingConversations,
        error,
        initialized,

        // Actions
        sendMessage: enhancedSendMessage,
        handleRetry,
        cancelResponse,
        switchConversation,
        deleteConversation: deleteConversationById, // Renamed for backward compatibility
        newChat,
        refreshConversation,
        loadAllConversations,
    };
}
