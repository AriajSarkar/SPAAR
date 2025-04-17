"use client";

import React from 'react';
import { motion } from 'motion/react';
import { FloatingNavbar } from '@/components/Navbar/FloatingNavbar';
import { ChatInput } from '@/components/Chat/ChatInput';
import { MessagesContainer } from '@/components/Chat/MessagesContainer';
import { ChatSidebar } from '@/components/Chat/ChatSidebar';
import { useChat } from '@/components/Chat/useChat';
import { RiAddLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { FloatingTooltip } from '@/components/ui/tooltip/FloatingTooltip';

/**
 * Main chat page component that brings together all chat-related components
 * Uses heart-themed styling for a consistent brand experience
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
    newChat
  } = useChat();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Chat history sidebar */}
      <ChatSidebar
        conversations={conversations}
        currentSessionId={sessionId}
        onSelectConversation={switchConversation}
        onDeleteConversation={deleteConversation}
        onNewChat={newChat}
        isLoading={loadingConversations}
      />
      
      {/* Main chat interface */}
      <div className="flex flex-col flex-1 h-full">
        <FloatingNavbar />

        {/* Fixed top header area */}
        <div className="fixed top-0 left-0 right-0 pt-16 pb-2 bg-background/80 backdrop-blur-sm z-10 md:pl-64">
          {/* Heart-themed gradient heading with subtle animation */}
          <motion.div
            className="flex items-center justify-between px-4 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold mt-4 bg-gradient-to-r from-[var(--heart-blue-500)] to-[var(--heart-cyan-500)] inline-block text-transparent bg-clip-text">
              Heart Chat
            </h1>
            
            {/* New chat button */}
            <Button
              variant="outline"
              size="sm"
              onClick={newChat}
              disabled={isLoading}
              className="border border-[var(--heart-blue-500)]/40 hover:bg-[var(--heart-blue-500)]/10"
            >
              <RiAddLine className="mr-1 h-4 w-4" /> New Chat
            </Button>
          </motion.div>
        </div>

        {/* Main content area with fixed header and footer */}
        <main className="flex flex-col w-full h-full pt-[72px] pb-[140px] md:pl-64">
          {/* Messages container component */}
          <MessagesContainer
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            currentStreamContent={currentStreamContent}
            onRetry={handleRetry}
            sessionId={sessionId}
          />
        </main>

        {/* Chat input component */}
        <div className="md:pl-64">
          <ChatInput
            onSendMessage={sendMessage}
            isLoading={isLoading}
            onCancel={cancelResponse}
          />
        </div>
      </div>
    </div>
  );
}