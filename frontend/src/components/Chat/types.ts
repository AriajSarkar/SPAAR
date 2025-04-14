/**
 * Type definitions for the Heart Chat components
 */

/**
 * Represents a single chat message in the conversation
 */
export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
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
}

/**
 * Props for the MessagesContainer component
 */
export interface MessagesContainerProps {
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    currentStreamContent: string;
    onRetry: (messageIndex: number) => void;
}

/**
 * Props for the ChatContainer component
 */
export interface ChatContainerProps {
    children?: React.ReactNode;
}