'use client';

import { useEffect, useState } from 'react';
import { useChatStore, initializeChatStore } from '@/lib/store/chatStore';
import { ChatMessage, MessageSender } from '@/lib/store/chat-types';

export type { ChatMessage, MessageSender };

/**
 * Custom hook for chat functionality with session management
 * Uses the Zustand store with optimizations to prevent UI freezing
 */
export function useChat() {
    const [isReady, setIsReady] = useState(false);

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

    // Initialize the chat store on first load - using lazy initialization pattern
    useEffect(() => {
        // Using requestIdleCallback for non-critical initialization
        // Falls back to setTimeout for browsers without requestIdleCallback
        const requestIdleCallback =
            typeof window !== 'undefined'
                ? window.requestIdleCallback || ((cb) => setTimeout(cb, 1))
                : (cb: IdleRequestCallback) => setTimeout(cb, 1);

        // Initialize in the next idle period
        const idleCallbackId = requestIdleCallback(() => {
            initializeChatStore();
            setIsReady(true);
        });

        // Cleanup
        return () => {
            if (typeof window !== 'undefined' && window.cancelIdleCallback) {
                window.cancelIdleCallback(idleCallbackId);
            } else {
                clearTimeout(idleCallbackId);
            }
        };
    }, []);

    // Set up automatic conversation refresh during idle times
    useEffect(() => {
        if (!isReady) return;

        let timeoutId: NodeJS.Timeout;

        const refreshIfNotBusy = () => {
            if (!isLoading && !isStreaming) {
                loadAllConversations();
            }
            // Schedule next refresh
            timeoutId = setTimeout(refreshIfNotBusy, 30000); // Every 30 seconds
        };

        // Start refresh cycle
        timeoutId = setTimeout(refreshIfNotBusy, 5000);

        return () => clearTimeout(timeoutId);
    }, [isLoading, isStreaming, loadAllConversations, isReady]);

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
        isReady,

        // Actions
        sendMessage,
        handleRetry,
        cancelResponse,
        switchConversation,
        deleteConversation: deleteConversationById, // Renamed for backward compatibility
        newChat,
        refreshConversation,
        loadAllConversations,
    };
}
