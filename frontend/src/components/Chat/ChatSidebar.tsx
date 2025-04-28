"use client";

import React, { useState, useEffect } from 'react';
import { RiAddLine, RiCloseLine, RiDeleteBinLine, RiMoreLine, RiChat1Line } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { ConversationSummary } from '@/lib/api-client';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProfileMenu } from '@/components/Profile/ProfileMenu';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth/AuthContext';

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
 * All loading operations happen in the background with no visual indicators
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
  const { user } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(!isMobile);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Determine which state to use
  const sidebarOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setSidebarOpen = setIsOpen || setInternalIsOpen;

  // Close sidebar on mobile when screen size changes
  useEffect(() => {
    if (isOpen === undefined) {
      setInternalIsOpen(!isMobile);
    }
  }, [isMobile, isOpen]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    return `${(user.first_name?.[0] || '').toUpperCase()}${(user.last_name?.[0] || '').toUpperCase()}` || 'U';
  };

  // Group conversations by time periods
  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <>
      {/* Sidebar - fixed position with proper z-index */}
      <div 
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-card/95 border-r border-[var(--border)] flex flex-col h-screen transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "z-30" // z-index that works with the main content
        )}
      >
        {/* Logo area with close button for all screen sizes */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/" className="text-foreground text-xl font-medium hover:text-[var(--heart-blue-500)] transition-colors cursor-pointer">
            AI Chat
          </Link>
          
          {/* Close button - visible on all screen sizes including desktop */}
          <button
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* New Chat button - never disabled */}
        <div className="px-3 py-2">
          <Button 
            onClick={onNewChat}
            className="w-full h-10 bg-[var(--heart-blue-500)] hover:bg-[var(--heart-blue-700)] text-white rounded-lg justify-start px-3 transition-colors"
          >
            <RiAddLine className="h-5 w-5 mr-2" />
            <span className="font-medium">New chat</span>
          </Button>
        </div>

        {/* Conversation list with scroll container */}
        <div className="flex-1 overflow-y-auto">
          {/* Conversation groups */}
          {Object.entries(groupedConversations).map(([period, convos]) => (
            <div key={period} className="mt-4">
              {/* Date grouping headers */}
              <div className="px-3 mb-2">
                <div className="text-xs font-medium text-muted-foreground">{period}</div>
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
          
          {/* Empty state - only shown when no conversations exist */}
          {conversations.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground px-3">
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
        </div>
        
        {/* Footer area with profile menu */}
        <div className="mt-auto p-3 border-t border-[var(--border)]">
          <button 
            className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/80 transition-colors"
            onClick={() => setShowProfileMenu(true)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[var(--heart-cyan-500)] text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <span className="text-sm text-foreground font-medium">
                {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User' : 'User'}
              </span>
            </div>
            <div className="flex items-center justify-center rounded-full w-5 h-5 bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </button>
        </div>
      </div>
      
      {/* Overlay to close sidebar on mobile - with proper z-index */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Profile menu modal */}
      <AnimatePresence>
        {showProfileMenu && (
          <ProfileMenu onClose={() => setShowProfileMenu(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Helper function to group conversations by time period
 */
function groupConversationsByDate(conversations: ConversationSummary[]) {
  // Create a copy to avoid mutating the original
  const sortedConversations = [...conversations].sort((a, b) => {
    // Sort by last message date (most recent first)
    const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
    const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
    return dateB - dateA;
  });
  
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
  
  sortedConversations.forEach(conversation => {
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

function ConversationItem({ 
  conversation, 
  isActive, 
  onClick, 
  onDelete
}: ConversationItemProps) {
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
        'group flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-muted/80 relative',
        isActive && 'bg-muted'
      )}
      onClick={onClick}
    >
      {/* Chat icon */}
      <RiChat1Line className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-2" />
      
      {/* Title */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm text-foreground truncate">
          {truncatedTitle}
        </p>
        {conversation.lastMessageDate && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
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
          <RiDeleteBinLine className="h-4 w-4 text-destructive hover:text-destructive/80" />
        ) : (
          <RiMoreLine className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
        )}
      </div>
    </div>
  );
}
