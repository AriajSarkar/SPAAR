"use client";

import { useState, useRef, useCallback } from 'react';
import { Message } from './types';

/**
 * Custom hook for chat functionality including message management and API interaction
 * Implements heart-themed project guidelines with clean error handling
 * 
 * @returns Chat state and functions for managing messages
 */
export function useChat() {
    // State for messages
    const [messages, setMessages] = useState<Message[]>([]);
    // Loading state
    const [isLoading, setIsLoading] = useState(false);
    // Streaming state (when message is coming in chunks)
    const [isStreaming, setIsStreaming] = useState(false);
    // Current streaming message content
    const [currentStreamContent, setCurrentStreamContent] = useState('');
    // Track failed messages for retry
    const [failedMessageIndex, setFailedMessageIndex] = useState<number | null>(null);

    // Ref for abort controller to cancel ongoing requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // Generate a unique ID for messages
    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    /**
     * Send a message to the AI and process the response
     * Handles multiple response formats from the n8n webhook
     * 
     * @param messageText - The user's message to send to the API
     * @returns The AI's response as a string
     */
    const sendMessageToAI = async (messageText: string): Promise<string> => {
        const encodedMsg = encodeURIComponent(messageText);

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        try {
            // Call the API with the encoded message
            const response = await fetch(`/api/chat/${encodedMsg}`, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Only propagate backend errors with their original message
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();

            // Handle different response formats that might come from the n8n webhook

            // Format 1: Array with objects containing 'output' property
            if (Array.isArray(data) && data.length > 0) {
                if (data[0].output) {
                    return data[0].output;
                }
                // If data is an array but doesn't have the expected structure
                return JSON.stringify(data);
            }

            // Format 2: Object with 'output' array property
            if (data.output && Array.isArray(data.output) && data.output.length > 0) {
                if (typeof data.output[0] === 'object' && data.output[0].output) {
                    return data.output[0].output;
                }
                if (typeof data.output[0] === 'string') {
                    return data.output[0];
                }
            }

            // Format 3: Direct 'response' property
            if (data.response) {
                return data.response;
            }

            // If none of the expected formats match, return the data as a string
            return typeof data === 'string'
                ? data
                : JSON.stringify(data) || "I'm sorry, I couldn't generate a response at this time.";
        } catch (error: any) {
            // Clear the abort controller reference if it's been used
            abortControllerRef.current = null;

            // Only re-throw errors - no special handling for timeouts
            throw error;
        }
    };

    /**
     * Process the bot response separately to allow for retries
     */
    const processBotResponse = async (userInput: string) => {
        // Start loading state
        setIsLoading(true);

        try {
            // Create a bot message first to prepare for streaming response
            const botMessage: Message = {
                id: generateId(),
                content: '',
                sender: 'bot',
                timestamp: new Date(),
            };

            // Add the empty bot message
            setMessages((prev) => [...prev, botMessage]);

            // Call the API and get response
            setIsStreaming(true);
            const botResponse = await sendMessageToAI(userInput);

            // Simulate streaming text for heart-themed streaming experience
            let currentText = '';
            const words = botResponse.split(' ');

            for (let i = 0; i < words.length; i++) {
                // Check if streaming has been aborted
                if (!isStreaming) break;

                currentText += (i > 0 ? ' ' : '') + words[i];
                setCurrentStreamContent(currentText);

                // Wait a short time between words for a natural feel
                await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 50));
            }

            // Update the bot message with full content
            setMessages((prev) =>
                prev.map(msg =>
                    msg.id === botMessage.id
                        ? { ...msg, content: botResponse }
                        : msg
                )
            );

            // End streaming
            setCurrentStreamContent('');
            setIsStreaming(false);

        } catch (error: any) {
            console.error('Error fetching chat response:', error);

            // Find the index of the last user message
            const lastUserMsgIndex = messages.length - 1;
            setFailedMessageIndex(lastUserMsgIndex);

            // Only show backend errors
            setMessages((prev) => [
                ...prev,
                {
                    id: generateId(),
                    content: error.message || "Backend error occurred. Please try again later.",
                    sender: 'bot',
                    timestamp: new Date(),
                    error: true,
                    isRetryable: true
                }
            ]);

            // Cancel any ongoing streaming
            setIsStreaming(false);
            setCurrentStreamContent('');

        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle sending a new message
     */
    const sendMessage = useCallback((message: string) => {
        if (!message.trim()) return;

        // Create user message
        const userMessage: Message = {
            id: generateId(),
            content: message,
            sender: 'user',
            timestamp: new Date(),
        };

        // Add the user message to the list
        setMessages((prev) => [...prev, userMessage]);

        // Process bot response
        processBotResponse(message);
    }, [messages]);

    /**
     * Retry a failed message
     * @param userMessageIndex The index of the user message to retry
     */
    const handleRetry = async (userMessageIndex: number) => {
        if (isLoading || userMessageIndex < 0 || userMessageIndex >= messages.length) return;

        // Get the user message to retry
        const userMessage = messages[userMessageIndex];
        if (userMessage.sender !== 'user') return;

        // Remove all messages after the user message (including any error responses)
        const remainingMessages = messages.slice(0, userMessageIndex + 1);
        setMessages(remainingMessages);
        setFailedMessageIndex(null);

        // Call the API again with the same message
        await processBotResponse(userMessage.content);
    };

    /**
     * Cancel the current streaming response
     */
    const cancelResponse = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Reset streaming state
        setIsStreaming(false);
        setCurrentStreamContent('');
        setIsLoading(false);

        // Update the last bot message to show it was cancelled
        setMessages(prev => {
            // Find the last bot message
            const lastBotIndex = [...prev].reverse().findIndex(msg => msg.sender === 'bot');
            if (lastBotIndex === -1) return prev;

            const actualIndex = prev.length - 1 - lastBotIndex;

            // Clone the messages array
            const updated = [...prev];
            // Mark the message as cancelled if it's empty (still streaming)
            if (!updated[actualIndex].content) {
                updated[actualIndex] = {
                    ...updated[actualIndex],
                    content: "Response cancelled. You can ask another question.",
                    error: true
                };
            }

            return updated;
        });
    };

    return {
        messages,
        isLoading,
        isStreaming,
        currentStreamContent,
        sendMessage,
        handleRetry,
        cancelResponse
    };
}