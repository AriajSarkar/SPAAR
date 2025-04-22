"use client";

import React, { useRef, useEffect } from 'react';
import { ChatMessage, MessageSkeleton } from '@/components/Chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { MessagesContainerProps } from './types';
// Import Remix Icons
import { RiRefreshLine } from '@remixicon/react';

/**
 * MessagesContainer component handles displaying the chat messages
 * Redesigned to match DeepSeek's dark interface style
 */
export const MessagesContainer = ({
    messages,
    isLoading,
    isStreaming,
    currentStreamContent,
    onRetry
}: MessagesContainerProps) => {
    // Refs for scrolling
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, currentStreamContent]);

    return (
        <div className="flex-1 overflow-hidden w-full">
            {/* Simple container with no animations */}
            <div
                ref={chatContainerRef}
                className="h-full overflow-y-auto"
            >
                <div className="flex flex-col">
                    {messages.map((msg, index) => (
                        <div key={msg.id} className="w-full">
                            <ChatMessage
                                content={
                                    isStreaming && msg.id === messages[messages.length - 1].id
                                        ? currentStreamContent
                                        : msg.content
                                }
                                sender={msg.sender}
                                timestamp={msg.timestamp}
                                isStreaming={
                                    isStreaming && msg.id === messages[messages.length - 1].id
                                }
                                error={msg.error}
                            />

                            {/* Simple retry button for errors */}
                            {msg.error && msg.isRetryable && (
                                <div className="max-w-3xl mx-auto w-full px-4 md:px-6 mt-2 mb-4 flex justify-start">
                                    <Button
                                        onClick={() => onRetry(index - 1)}
                                        className="text-xs px-3 py-1 h-7 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md"
                                        aria-label="Retry message"
                                    >
                                        <RiRefreshLine size={14} />
                                        Retry
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Skeleton loading when waiting for AI response */}
                    {isLoading && !isStreaming && (
                        <MessageSkeleton />
                    )}

                    {/* Auto-scroll anchor */}
                    <div ref={messageEndRef} />
                </div>
            </div>
        </div>
    );
};