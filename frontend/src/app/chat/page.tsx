'use client';

import React, { useState, useEffect } from 'react';
import { ChatInput } from '@/components/Chat/features/ChatInput';
import { MessagesContainer } from '@/components/Chat/features/MessagesContainer';
import { ChatSidebar } from '@/components/Chat/ChatSidebar';
import { useChat } from '@/components/Chat/useChat';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { RiMenuLine } from '@remixicon/react';

/**
 * Main chat page component that brings together all chat-related components
 * Fixed z-index and layout issues for proper responsiveness
 */
export default function ChatPage() {
    // Use our custom hook for chat functionality
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
    } = useChat();

    // State to track sidebar visibility
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

    // Update sidebar state when screen size changes
    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Chat history sidebar (outside the main flex container) */}
            <ChatSidebar
                conversations={conversations}
                currentSessionId={sessionId}
                onSelectConversation={switchConversation}
                onDeleteConversation={deleteConversation}
                onNewChat={newChat}
                isLoading={loadingConversations}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            {/* Main chat interface - with proper margin when sidebar is open */}
            <div
                className={`relative flex-1 flex flex-col h-screen w-full transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-64' : 'ml-0'
                    }`}
            >
                {/* Sidebar open button - visible on all screen sizes when sidebar is closed */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed top-4 left-4 z-40 p-2 rounded-md bg-card border border-[var(--border)] shadow-sm hover:bg-muted transition-colors"
                        aria-label="Open sidebar"
                    >
                        <RiMenuLine className="h-5 w-5 text-muted-foreground" />
                    </button>
                )}

                {/* Empty state or messages area */}
                <div
                    className={`flex-1 overflow-hidden flex flex-col ${messages.length === 0 ? 'items-center justify-center' : ''}`}
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center px-4 max-w-xl">
                            <div className="mb-6 w-16 h-16 rounded-full bg-[var(--heart-blue-500)] flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
                                </svg>
                            </div>
                            <h1 className="text-2xl font-medium text-foreground mb-2">Hi, I'm your AI Assistant.</h1>
                            <p className="text-muted-foreground">How can I help you today?</p>
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
                </div>

                {/* Message input area - animates from center to bottom with messages */}
                <div
                    className={`w-full transition-all duration-500 ease-in-out ${messages.length === 0
                            ? 'absolute left-0 right-0 bottom-1/3 transform-gpu'
                            : 'sticky bottom-0 left-0 right-0 bg-background border-t border-[var(--border)]'
                        }`}
                >
                    <div className="max-w-3xl mx-auto px-4 pb-6 relative">
                        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} onCancel={cancelResponse} />
                    </div>
                </div>
            </div>
        </div>
    );
}
