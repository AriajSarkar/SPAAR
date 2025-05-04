'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, MessageSkeleton, TypingIndicator } from '@/components/Chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { MessagesContainerProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { RiRefreshLine } from '@remixicon/react';
import { cn } from '@/lib/utils';

/**
 * MessagesContainer component handles displaying the chat messages
 * Enhanced with better scroll behavior, animation and error handling
 */
export const MessagesContainer = ({
    messages,
    isLoading,
    isStreaming,
    currentStreamContent,
    onRetry,
}: MessagesContainerProps) => {
    // Refs for scrolling
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    // State to track if user has scrolled up away from bottom (to prevent auto-scroll)
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
    // State to track if new message indicator should be shown
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);

    // Handle scrolling behavior
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            // Check if the user has scrolled up
            const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
            setUserHasScrolledUp(!atBottom);
            setShowScrollToBottom(!atBottom && messages.length > 0);
        };

        // Add scroll listener
        container.addEventListener('scroll', handleScroll);

        // Cleanup
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [messages.length]);

    // Auto-scroll to bottom on new messages if user hasn't scrolled up
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container || userHasScrolledUp) return;

        // Smooth scroll to bottom
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, currentStreamContent, userHasScrolledUp]);

    // Force scroll to bottom when a new message is added
    useEffect(() => {
        if (messages.length > 0 && !isStreaming) {
            setUserHasScrolledUp(false);
            setTimeout(() => {
                const container = chatContainerRef.current;
                if (container) {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }, 100);
        }
    }, [messages.length, isStreaming]);

    // Scroll to bottom handler
    const scrollToBottom = () => {
        const container = chatContainerRef.current;
        if (container) {
            setUserHasScrolledUp(false);
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="flex-1 overflow-hidden w-full relative">
            {/* Chat container with messages */}
            <div
                ref={chatContainerRef}
                className="h-full overflow-y-auto chat-scrollbar scroll-smooth"
                aria-live="polite"
            >
                <div className="flex flex-col">
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            className="w-full"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChatMessage
                                content={
                                    isStreaming && index === messages.length - 1 ? currentStreamContent : msg.content
                                }
                                sender={msg.sender}
                                timestamp={msg.timestamp}
                                isStreaming={isStreaming && index === messages.length - 1}
                                error={msg.error}
                                errorDetails={msg.error ? 'There was an issue processing your request.' : undefined}
                            />

                            {/* Retry button for errors */}
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
                        </motion.div>
                    ))}

                    {/* Loading state with skeleton */}
                    {isLoading && !isStreaming && <MessageSkeleton />}

                    {/* Typing indicator when thinking but not streaming yet */}
                    {isLoading && !isStreaming && messages.length > 0 && <TypingIndicator />}

                    {/* Auto-scroll anchor */}
                    <div ref={messageEndRef} />
                </div>
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
                {showScrollToBottom && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn(
                            'absolute bottom-4 right-4 bg-primary text-primary-foreground',
                            'rounded-full p-2 shadow-md hover:bg-primary/90 transition-colors',
                        )}
                        onClick={scrollToBottom}
                        aria-label="Scroll to bottom"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
