// import { ReactNode } from 'react';

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
    errorDetails?: string;
    metadata?: {
        model?: string;
        tokens?: number;
        processingTime?: number;
        [key: string]: unknown;
    };
}

/**
 * Props for the ChatInput component
 */
export interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    onCancel: () => void;
    disabled?: boolean;
    placeholder?: string;
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
    className?: string;
}

/**
 * Props for session management controls
 */
export interface SessionControlProps {
    onClearConversation: () => void;
    sessionId: string | null;
    isLoading: boolean;
}

/**
 * Network status interface for connectivity tracking
 */
export interface NetworkStatus {
    online: boolean;
    retryCount: number;
    lastRetry: Date | null;
}

/**
 * Error information interface with additional details
 */
export interface ErrorInfo {
    message: string;
    code?: string;
    recoverable: boolean;
    timestamp: Date;
}

/**
 * Streaming state interface for tracking streaming progress
 */
export interface StreamingState {
    isStreaming: boolean;
    content: string;
    progress: number; // 0-100
    startTime: Date | null;
    error: ErrorInfo | null;
}

export interface MessageAttachment {
    type: 'file' | 'image' | 'audio' | 'video';
    name: string;
    url: string;
    mimeType: string;
    size?: number;
    metadata?: Record<string, unknown>;
}
