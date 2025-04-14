"use client";

import React from 'react';
import { motion } from 'motion/react';
import { FloatingNavbar } from '@/components/Navbar/FloatingNavbar';
import { ChatInput } from '@/components/Chat/ChatInput';
import { MessagesContainer } from '@/components/Chat/MessagesContainer';
import { useChat } from '@/components/Chat/useChat';

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
    cancelResponse
  } = useChat();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <FloatingNavbar />

      {/* Fixed top header area */}
      <div className="fixed top-0 left-0 right-0 pt-16 pb-2 bg-background/80 backdrop-blur-sm z-10">
        {/* Heart-themed gradient heading with subtle animation */}
        <motion.h1
          className="text-2xl font-bold mt-4 text-center bg-gradient-to-r from-[var(--heart-blue-500)] to-[var(--heart-cyan-500)] inline-block text-transparent bg-clip-text w-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Heart Chat
        </motion.h1>
      </div>

      {/* Main content area with fixed header and footer */}
      <main className="flex flex-col w-full h-full pt-[72px] pb-[140px]">
        {/* Messages container component */}
        <MessagesContainer
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          currentStreamContent={currentStreamContent}
          onRetry={handleRetry}
        />
      </main>

      {/* Chat input component */}
      <ChatInput
        onSendMessage={sendMessage}
        isLoading={isLoading}
        onCancel={cancelResponse}
      />
    </div>
  );
}