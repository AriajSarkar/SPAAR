import { ReactNode } from 'react';

/**
 * Type definitions for the Heart Chat components
 */


// Message sender types
export type MessageSender = 'user' | 'bot';

// Chat message interface
export interface ChatMessage {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  error?: boolean;
  isRetryable?: boolean;
}

/**
 * Props for the ChatInput component
 */
export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * Props for the MessagesContainer component
 */
export interface MessagesContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamContent: string;
  onRetry: (index: number) => void;
  sessionId?: string | null;
}

/**
 * Props for the ChatContainer component
 */
export interface ChatContainerProps {
  children?: React.ReactNode;
}

/**
 * Props for session management controls
 */
export interface SessionControlProps {
  onClearConversation: () => void;
  sessionId: string | null;
  isLoading: boolean;
}