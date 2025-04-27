"use client";

import { useEffect } from 'react';
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
    loadAllConversations
  } = useChatStore();

  // Initialize the chat store on first load
  useEffect(() => {
    // Initialize store with saved session ID and load conversations
    const cleanup = initializeChatStore();
    return cleanup;
  }, []);

  // Set up automatic conversation refresh
  useEffect(() => {
    // Set up an interval to refresh the conversation list
    // This ensures the sidebar stays updated without requiring manual refresh
    const intervalId = setInterval(() => {
      if (!isLoading && !isStreaming) {
        loadAllConversations();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(intervalId);
  }, [isLoading, isStreaming, loadAllConversations]);

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
    sendMessage,
    handleRetry,
    cancelResponse,
    switchConversation,
    deleteConversation: deleteConversationById, // Renamed for backward compatibility
    newChat,
    refreshConversation,
    loadAllConversations
  };
}