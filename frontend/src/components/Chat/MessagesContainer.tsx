"use client";

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, TypingIndicator, MessageSkeleton } from '@/components/Chat/ChatMessage';
import { FloatingCardStack } from '@/components/ui/FloatingCardStack';
import { FloatingTooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { MessagesContainerProps } from './types';
// Import Remix Icons
import { RiHeartFill, RiRefreshLine } from '@remixicon/react';

/**
 * MessagesContainer component handles displaying the chat messages
 * Includes scrolling behavior, empty state, and message animations
 * Features a sophisticated skeleton loading effect for better UX
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
        <div className="flex-1 overflow-hidden mx-auto w-full max-w-4xl px-4">
            <FloatingCardStack
                className="h-full overflow-hidden flex flex-col rounded-2xl shadow-lg border border-[var(--heart-blue-500)]/10"
                patternStyle="dots"
            >
                {/* Messages area with improved scrolling */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6 md:px-6"
                >
                    {messages.length === 0 ? (
                        <motion.div
                            className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-[var(--heart-blue-500)]/20 to-[var(--heart-cyan-500)]/20 flex items-center justify-center">
                                <RiHeartFill
                                    size={28}
                                    className="text-[var(--heart-blue-500)]"
                                />
                            </div>
                            <h2 className="text-xl font-medium mb-2 bg-gradient-to-r from-[var(--heart-blue-500)] to-[var(--heart-cyan-500)] inline-block text-transparent bg-clip-text">Welcome to Heart Chat</h2>
                            <p className="text-sm max-w-sm">Send a message below to start your conversation with our heart-themed AI assistant</p>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col space-y-6">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id}
                                        className="flex flex-col"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
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
                                            animationDelay={50}
                                            error={msg.error}
                                        />

                                        {/* Enhanced retry button with tooltip */}
                                        {msg.error && msg.isRetryable && (
                                            <motion.div
                                                className="flex justify-end mt-1 mb-2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <FloatingTooltip
                                                    content="Try sending this message again"
                                                    position="top"
                                                >
                                                    <Button
                                                        onClick={() => onRetry(index - 1)}
                                                        className="text-xs px-3 py-1 h-7 bg-[var(--heart-blue-500)]/10 hover:bg-[var(--heart-blue-500)]/20 text-[var(--heart-blue-500)] rounded-full transition-colors"
                                                        aria-label="Retry message"
                                                    >
                                                        <RiRefreshLine size={14} className="mr-1.5" />
                                                        Retry
                                                    </Button>
                                                </FloatingTooltip>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Enhanced skeleton loading UI with DeepSeek-inspired "thinking" style */}
                            {isLoading && !isStreaming && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {messages.length > 0 && messages[messages.length - 1].sender === 'user' ? (
                                        /* Show staggered skeleton messages when waiting for AI response */
                                        <div className="space-y-1">
                                            <div className="flex items-start mb-1">
                                                <div className="text-xs font-medium text-[color:var(--heart-cyan-700)]/70 ml-2">
                                                    AI is thinking...
                                                </div>
                                            </div>
                                            <MessageSkeleton count={1} sender="bot" />
                                        </div>
                                    ) : (
                                        /* Fallback to skeleton loading if we're in an unexpected state */
                                        <MessageSkeleton count={1} sender="bot" />
                                    )}
                                </motion.div>
                            )}

                            {/* Auto-scroll anchor */}
                            <div ref={messageEndRef} />
                        </div>
                    )}
                </div>
            </FloatingCardStack>
        </div>
    );
};