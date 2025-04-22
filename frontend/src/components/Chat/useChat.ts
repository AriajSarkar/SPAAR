"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  generateLLMResponse, 
  getConversationHistory, 
  deleteConversation, 
  generateSessionId,
  getAllConversations,
  ConversationSummary
} from '@/lib/api-client';

// Types for chat functionality
export type MessageSender = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  error?: boolean;
  isRetryable?: boolean;
}

/**
 * Generate a unique ID for messages
 */
function generateMessageId(): string {
  return generateSessionId(); // Reuse our session ID generator for message IDs
}

/**
 * Custom hook for chat functionality with session management
 */
export function useChat() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentStreamContent, setCurrentStreamContent] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  
  // Refs for managing async operations
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize session ID if needed and load conversations
  useEffect(() => {
    // Try to load session ID from localStorage
    const savedSessionId = localStorage.getItem('chat_session_id');
    
    if (savedSessionId) {
      setSessionId(savedSessionId);
      
      // Load existing conversation if session ID exists
      loadConversation(savedSessionId);
    } else {
      // Create a new session ID
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      localStorage.setItem('chat_session_id', newSessionId);
    }

    // Load all conversations
    loadAllConversations();
  }, []);
  
  /**
   * Load all conversations from the backend
   */
  const loadAllConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const allConversations = await getAllConversations();
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  /**
   * Load conversation history from the backend
   */
  const loadConversation = useCallback(async (sid: string) => {
    try {
      setIsLoading(true);
      const history = await getConversationHistory(sid);
      
      // Convert history to message format based on the actual API response
      if (history && history.history && Array.isArray(history.history)) {
        const formattedMessages = history.history.map((msg: any) => ({
          id: generateMessageId(),
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'bot',
          timestamp: new Date(msg.created_at || Date.now()),
          error: false,
        }));
        
        setMessages(formattedMessages);
      }
      
      // Refresh conversation list after loading a conversation
      loadAllConversations();
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Don't show error to user, just start fresh
    } finally {
      setIsLoading(false);
    }
  }, [loadAllConversations]);
  
  /**
   * Switch to a different conversation
   */
  const switchConversation = useCallback(async (sid: string) => {
    if (isLoading) return;
    
    try {
      setSessionId(sid);
      localStorage.setItem('chat_session_id', sid);
      await loadConversation(sid);
    } catch (error) {
      console.error('Error switching conversation:', error);
    }
  }, [isLoading, loadConversation]);

  /**
   * Send a message to the LLM API
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;
    
    // Create a new user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Create abort controller for the request
      abortControllerRef.current = new AbortController();
      
      // Start streaming
      setIsStreaming(true);
      setCurrentStreamContent('');
      
      // Add placeholder for bot response
      const responsePlaceholder: ChatMessage = {
        id: generateMessageId(),
        content: '',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, responsePlaceholder]);
      
      // Stream handler for updating content as it arrives
      const handleStreamChunk = (chunk: string) => {
        setCurrentStreamContent(prev => {
          const newContent = prev + chunk;
          
          // Also update the message in the messages array
          setMessages(messages => {
            const updatedMessages = [...messages];
            if (updatedMessages.length > 0) {
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: newContent,
              };
            }
            return updatedMessages;
          });
          
          return newContent;
        });
      };
      
      // Make the API request with the stream handler
      const response = await generateLLMResponse(
        message, 
        sessionId || undefined,
        true,
        handleStreamChunk // Now properly typed and accepted
      );
      
      // Stream should be complete by now, but ensure final state is updated
      if (response && (response.response || typeof response.response === 'string')) {
        const finalContent = response.response || '';
        
        // Ensure the final message content is set correctly
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: finalContent,
            };
          }
          return updated;
        });
        
        // Reset streaming content
        setCurrentStreamContent(finalContent);
        
        // Refresh conversation list after sending a message
        setTimeout(() => loadAllConversations(), 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update last message to show error
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: error instanceof Error 
              ? error.message 
              : 'An error occurred while processing your request.',
            error: true,
            isRetryable: true,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, sessionId, loadAllConversations]);
  
  /**
   * Retry sending a failed message
   */
  const handleRetry = useCallback((index: number) => {
    if (index < 0 || index >= messages.length) return;
    
    const messageToRetry = messages[index];
    if (messageToRetry.sender !== 'user') return;
    
    // Remove the failed bot response message
    setMessages(prev => prev.slice(0, index + 1));
    
    // Resend the user message
    sendMessage(messageToRetry.content);
  }, [messages, sendMessage]);
  
  /**
   * Cancel an in-progress response
   */
  const cancelResponse = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsLoading(false);
    setIsStreaming(false);
    
    // Remove the last message if it's a bot message being generated
    setMessages(prev => {
      if (prev.length > 0 && prev[prev.length - 1].sender === 'bot' && prev[prev.length - 1].content === '') {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);
  
  /**
   * Delete a conversation
   */
  const deleteConversationById = useCallback(async (sid: string) => {
    if (isLoading) return;
    
    try {
      await deleteConversation(sid);
      
      // Update conversations list
      setConversations(prev => prev.filter(conv => conv.id !== sid));
      
      // If we deleted the current conversation, create a new one
      if (sid === sessionId) {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        localStorage.setItem('chat_session_id', newSessionId);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [isLoading, sessionId]);
  
  /**
   * Create a new conversation
   */
  const newChat = useCallback(async () => {
    if (isLoading) return;
    
    // Create a new session
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    localStorage.setItem('chat_session_id', newSessionId);
    
    // Clear messages
    setMessages([]);
    
    // Refresh conversation list
    loadAllConversations();
  }, [isLoading, loadAllConversations]);
  
  return {
    messages,
    isLoading,
    isStreaming,
    currentStreamContent,
    sendMessage,
    handleRetry,
    cancelResponse,
    sessionId,
    conversations,
    loadingConversations,
    switchConversation,
    deleteConversation: deleteConversationById,
    newChat
  };
}