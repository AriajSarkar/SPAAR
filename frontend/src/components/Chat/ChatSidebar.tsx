"use client";

import React, { useState, useEffect } from 'react';
import { RiAddLine, RiCloseLine, RiMenuLine, RiDeleteBinLine, RiMoreLine, RiChat1Line } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { ConversationSummary } from '@/lib/api-client';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  currentSessionId: string | null;
  onSelectConversation: (sessionId: string) => void;
  onDeleteConversation: (sessionId: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

/**
 * ChatSidebar component that displays conversation history
 */
export function ChatSidebar({
  conversations,
  currentSessionId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  isLoading = false,
  isOpen,
  setIsOpen
}: ChatSidebarProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  // Use prop-based open state if provided, otherwise use internal state
  const [internalIsOpen, setInternalIsOpen] = useState(!isMobile);
  
  // Determine which state to use
  const sidebarOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setSidebarOpen = setIsOpen || setInternalIsOpen;

  // Close sidebar on mobile when screen size changes
  useEffect(() => {
    if (isOpen === undefined) {
      setInternalIsOpen(!isMobile);
    }
  }, [isMobile, isOpen]);

  // Group conversations by time periods
  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <>
      {/* Sidebar - fixed position with proper z-index */}
      <div 
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-[#111111] dark:bg-[#111111] border-r border-gray-800 flex flex-col h-screen transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "z-30" // z-index that works with the main content
        )}
      >
        {/* Logo area with close button for all screen sizes */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/" className="text-gray-100 text-xl font-medium hover:text-white transition-colors cursor-pointer">
            AI Chat
          </Link>
          
          {/* Close button - visible on all screen sizes including desktop */}
          <button
            className="p-1.5 text-gray-300 hover:text-white rounded-md hover:bg-gray-800/70"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* New Chat button */}
        <div className="px-3 py-2">
          <Button 
            onClick={onNewChat}
            disabled={isLoading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg justify-start px-3 transition-colors"
          >
            <RiAddLine className="h-5 w-5 mr-2" />
            <span className="font-medium">New chat</span>
          </Button>
        </div>

        {/* Conversation groups */}
        {Object.entries(groupedConversations).map(([period, convos]) => (
          <div key={period} className="mt-4">
            {/* Date grouping headers */}
            <div className="px-3 mb-2">
              <div className="text-xs font-medium text-gray-500">{period}</div>
            </div>

            {/* Conversations in this group */}
            <div className="px-2 space-y-1">
              {convos.map((conversation) => (
                <ConversationItem 
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === currentSessionId}
                  onClick={() => {
                    onSelectConversation(conversation.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  onDelete={() => onDeleteConversation(conversation.id)}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Empty state */}
        {conversations.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center text-gray-500 px-3">
            <p className="text-sm">No conversations yet</p>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center p-4">
            <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
          </div>
        )}
        
        {/* Footer area */}
        <div className="mt-auto p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-800 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white">
              U
            </div>
            <span className="text-sm text-gray-300">Profile</span>
          </div>
        </div>
      </div>
      
      {/* Overlay to close sidebar on mobile - with proper z-index */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Helper function to group conversations by time period
 */
function groupConversationsByDate(conversations: ConversationSummary[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const result: Record<string, ConversationSummary[]> = {
    'Today': [],
    'Yesterday': [],
    'Last 7 Days': [],
    'Last 30 Days': [],
    'Older': []
  };
  
  conversations.forEach(conversation => {
    if (!conversation.lastMessageDate) {
      result['Today'].push(conversation);
      return;
    }
    
    const date = new Date(conversation.lastMessageDate);
    
    if (date >= today) {
      result['Today'].push(conversation);
    } else if (date >= yesterday) {
      result['Yesterday'].push(conversation);
    } else if (date >= oneWeekAgo) {
      result['Last 7 Days'].push(conversation);
    } else if (date >= oneMonthAgo) {
      result['Last 30 Days'].push(conversation);
    } else {
      result['Older'].push(conversation);
    }
  });
  
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(result).filter(([_, convos]) => convos.length > 0)
  );
}

/**
 * ConversationItem component that displays a single conversation in the sidebar
 */
interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  
  // Format date to be more readable and dynamic
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    let date;
    try {
      date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
    } catch (e) {
      return '';
    }
    
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // If different year, show year too
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  };

  // Get truncated title
  const title = conversation.title || 'New conversation';
  const truncatedTitle = title.length > 28 ? `${title.substring(0, 28)}...` : title;

  return (
    <div
      className={cn(
        'group flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-gray-800/70',
        isActive && 'bg-gray-800'
      )}
      onClick={onClick}
    >
      {/* Chat icon */}
      <RiChat1Line className="h-4 w-4 text-gray-400 flex-shrink-0 mr-2" />
      
      {/* Title */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm text-gray-200 truncate">
          {truncatedTitle}
        </p>
        {conversation.lastMessageDate && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {formatDate(conversation.lastMessageDate)}
          </p>
        )}
      </div>

      {/* Delete button */}
      <div 
        className="ml-2" 
        onClick={(e) => {
          e.stopPropagation();
          if (showDelete) {
            onDelete();
            setShowDelete(false);
          } else {
            setShowDelete(true);
          }
        }}
      >
        {showDelete ? (
          <RiDeleteBinLine className="h-4 w-4 text-red-400 hover:text-red-300" />
        ) : (
          <RiMoreLine className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100" />
        )}
      </div>
    </div>
  );
}
