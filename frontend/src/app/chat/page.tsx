'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useChat } from '@/components/Chat/useChat';
import { MessagesContainer } from '@/components/Chat/features/MessagesContainer';
import { ChatInput } from '@/components/Chat/features/ChatInput';
import { ChatSidebar } from '@/components/Chat/ChatSidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { ConversationSummary } from '@/lib/api-client';
import { RiMenuLine, RiInformationLine, RiRefreshLine } from '@remixicon/react';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

/**
 * Main chat page component that brings together all chat-related components
 * Enhanced with improved components, error handling, and accessibility
 */
export default function ChatPage() {
    const {
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
        deleteConversation,
        newChat,
        error,
        loadAllConversations,
    } = useChat();

    // Get authentication state
    const { isAuthenticated } = useAuth();

    // State to track sidebar visibility
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const [showTips, setShowTips] = useState(false);

    // Update sidebar state when screen size changes
    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    // Create ref to track loading state without causing effect re-runs
    const loadingStateRef = useRef(loadingConversations);

    // Update ref whenever loading state changes
    useEffect(() => {
        loadingStateRef.current = loadingConversations;
    }, [loadingConversations]);

    // Fetch conversations when component mounts or authentication changes
    useEffect(() => {
        if (isAuthenticated && !loadingStateRef.current && conversations.length === 0) {
            loadAllConversations();
        }
    }, [isAuthenticated, loadAllConversations, conversations.length]);
    // Using ref pattern avoids the dependency while maintaining proper effect behavior

    // Detect visibility changes to refresh content when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated && !isLoading && !isStreaming) {
                loadAllConversations();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, isLoading, isStreaming, loadAllConversations]);

    // Close sidebar on mobile after selecting conversation
    const handleSelectConversation = (id: string) => {
        switchConversation(id);
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    // Manual refresh handler
    const handleManualRefresh = useCallback(() => {
        if (!isLoading && !isStreaming) {
            loadAllConversations();
        }
    }, [isLoading, isStreaming, loadAllConversations]);

    const hasMessages = messages.length > 0;

    return (
        <div className="flex h-screen overflow-hidden bg-background relative">
            {/* Chat history sidebar */}
            <ChatSidebar
                conversations={conversations as ConversationSummary[]}
                currentSessionId={sessionId}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={deleteConversation}
                onNewChat={newChat}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                isLoading={loadingConversations}
            />

            {/* Main content area with proper z-index */}
            <div
                className={cn(
                    'flex flex-col w-full h-screen relative z-10',
                    isMobile && isSidebarOpen ? 'opacity-50' : 'opacity-100',
                )}
                style={{
                    marginLeft: isSidebarOpen && !isMobile ? '16rem' : 0,
                    transition: 'margin-left 0.2s ease-in-out, opacity 0.2s ease-in-out',
                }}
            >
                {/* Menu toggle button for mobile and Tips toggle button */}
                <div className="absolute top-4 w-full flex justify-between px-4 z-20">
                    {/* Show menu toggle button on all screen sizes when sidebar is closed */}
                    {(!isSidebarOpen || isMobile) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open menu"
                            className="hover:bg-muted transition-colors"
                        >
                            <RiMenuLine className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </Button>
                    )}

                    <div className={cn('ml-auto flex gap-2', !isSidebarOpen && !isMobile && 'ml-0')}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleManualRefresh}
                            disabled={isLoading || loadingConversations}
                            aria-label="Refresh conversations"
                            className="hover:bg-muted transition-colors"
                        >
                            <RiRefreshLine
                                className={cn(
                                    'h-4 w-4 text-muted-foreground hover:text-foreground',
                                    (isLoading || loadingConversations) && 'animate-spin',
                                )}
                            />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowTips(!showTips)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 h-8"
                        >
                            <RiInformationLine className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Tips</span>
                        </Button>
                    </div>
                </div>

                {/* Chat content area */}
                <div className={cn('flex-1 overflow-hidden flex flex-col relative', hasMessages ? 'pt-14' : '')}>
                    {!hasMessages ? (
                        <div className="flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto h-[60vh]">
                            <div className="mb-6 w-16 h-16 rounded-full bg-[var(--heart-blue-500)]/10 flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-[var(--heart-blue-500)]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-medium text-foreground mb-3">Welcome to Heart Chat</h1>
                            <p className="text-muted-foreground mb-6">
                                Ask me anything and I&apos;ll do my best to help you.
                            </p>

                            {/* Quick suggestions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mb-6">
                                {[
                                    'Tell me about Heart Chat',
                                    'What can you help me with?',
                                    'How do I create a new conversation?',
                                    'How do I delete a conversation?',
                                ].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        className="px-4 py-2 text-sm text-left rounded-md border border-[var(--border)] hover:bg-muted transition-colors"
                                        onClick={() => isAuthenticated && sendMessage(suggestion)}
                                        disabled={!isAuthenticated || isLoading}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Please don&apos;t share sensitive personal information as chat history may be retained
                                for service improvements.
                            </p>
                        </div>
                    ) : (
                        <MessagesContainer
                            messages={messages}
                            isLoading={isLoading}
                            isStreaming={isStreaming}
                            currentStreamContent={currentStreamContent}
                            onRetry={handleRetry}
                            sessionId={sessionId}
                        />
                    )}

                    {/* Tips card - repositioned to top right */}
                    <AnimatePresence>
                        {showTips && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="fixed top-16 right-4 sm:right-6 max-w-xs bg-card border border-[var(--border)] rounded-lg shadow-lg z-20"
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium flex items-center">
                                            <RiInformationLine className="mr-2 text-[var(--heart-blue-500)]" /> Tips
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => setShowTips(false)}
                                        >
                                            &times;
                                        </Button>
                                    </div>
                                    <ul className="text-xs space-y-2 text-muted-foreground">
                                        <li>
                                            • Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to
                                            cancel a response
                                        </li>
                                        <li>
                                            • Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑</kbd> to
                                            edit your last message
                                        </li>
                                        <li>
                                            • Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to
                                            send,{' '}
                                            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for
                                            new line
                                        </li>
                                        <li>
                                            • Click <RiRefreshLine className="inline h-3 w-3" /> to manually refresh
                                            conversations
                                        </li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Message input area with animation */}
                <div
                    className={cn(
                        'w-full transition-all duration-500 ease-in-out',
                        hasMessages
                            ? 'sticky bottom-0 left-0 right-0 bg-background border-t border-[var(--border)] z-10'
                            : 'absolute left-0 right-0 bottom-1/3 transform-gpu',
                    )}
                >
                    <div className="max-w-3xl mx-auto px-4 pb-6 relative">
                        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} onCancel={cancelResponse} />

                        {/* Error message displayed under input */}
                        {error && (
                            <div className="mt-2 px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
