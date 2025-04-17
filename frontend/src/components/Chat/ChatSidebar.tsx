"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiAddLine, RiCloseLine, RiMenuLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { ChatHistoryItem } from './ChatHistoryItem';
import { ConversationSummary } from '@/lib/api-client';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  currentSessionId: string | null;
  onSelectConversation: (sessionId: string) => void;
  onDeleteConversation: (sessionId: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
}

export function ChatSidebar({
  conversations,
  currentSessionId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  isLoading = false,
}: ChatSidebarProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Close sidebar on mobile when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  // Force refresh conversations on mount
  useEffect(() => {
    // This is just to ensure the component re-renders when conversations update
  }, [conversations]);

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-20 left-4 z-40 p-2 rounded-md bg-background border border-input shadow-md"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? (
            <RiCloseLine className="h-5 w-5" />
          ) : (
            <RiMenuLine className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`
              fixed top-0 left-0 z-30 h-full w-64 bg-card border-r border-border pt-16
              flex flex-col shadow-lg ${isMobile ? 'shadow-2xl' : ''}
            `}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-sm">Chat History</h2>
              <Button 
                size="sm" 
                onClick={onNewChat}
                disabled={isLoading}
                variant="outline"
                className="border border-[var(--heart-blue-500)]/40 hover:bg-[var(--heart-blue-500)]/10"
              >
                <RiAddLine className="mr-1 h-4 w-4" /> New Chat
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {(!conversations || conversations.length === 0) ? (
                <div className="text-center text-muted-foreground p-4 text-sm">
                  {isLoading ? "Loading conversations..." : "No conversation history yet"}
                </div>
              ) : (
                <AnimatePresence>
                  {conversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChatHistoryItem
                        conversation={conversation}
                        isActive={conversation.id === currentSessionId}
                        onClick={() => onSelectConversation(conversation.id)}
                        onDelete={() => onDeleteConversation(conversation.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              {isLoading && (
                <div className="flex justify-center p-4">
                  <div className="animate-pulse h-4 w-24 bg-muted rounded"></div>
                </div>
              )}
            </div>
            
            <div className="p-3 text-xs text-muted-foreground border-t border-border">
              {conversations?.length || 0} conversation{(conversations?.length || 0) !== 1 ? 's' : ''}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay to close sidebar on mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
