"use client"

import React from 'react'
import { cn } from '@/lib/utils'
// Import Remix Icon for error state only
import { RiRefreshLine } from '@remixicon/react'

export interface ChatMessageProps {
  /**
   * Message content to display
   */
  content: string
  /**
   * Who sent the message - 'user' or 'bot'
   */
  sender: 'user' | 'bot'
  /**
   * Whether the message is currently being streamed in
   */
  isStreaming?: boolean
  /**
   * Timestamp when the message was sent
   */
  timestamp?: Date
  /**
   * Whether the message represents an error state
   */
  error?: boolean
}

/**
 * ChatMessage component displays a single message in the chat interface
 * User messages aligned right, bot messages aligned left
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  isStreaming = false,
  timestamp = new Date(),
  error = false
}) => {
  return (
    <div className={cn(
      'w-full py-6',
      sender === 'bot' 
        ? 'bg-[#1a1a1a] border-b border-gray-800' 
        : 'bg-[#111111]'
    )}>
      <div className="max-w-3xl mx-auto w-full px-4 md:px-6">
        <div className={cn(
          'flex',
          sender === 'user' ? 'justify-end' : 'justify-start'
        )}>
          {/* Avatar for bot (only show on bot messages) */}
          {sender === 'bot' && (
            <div className="mr-4 mt-1 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                </svg>
              </div>
            </div>
          )}
          
          <div className={cn(
            'flex flex-col',
            sender === 'user' 
              ? 'items-end max-w-[85%]' 
              : 'items-start max-w-[85%]'
          )}>
            {/* Message content in a bubble */}
            <div className={cn(
              "px-4 py-3 rounded-2xl",
              sender === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#2c2c2c] text-gray-200',
              error && "bg-red-900/30 text-red-200"
            )}>
              <div className={cn(
                "text-sm whitespace-pre-wrap prose prose-sm max-w-none",
                sender === 'user' 
                  ? 'prose-invert' 
                  : 'dark:prose-invert',
                "prose-headings:font-semibold prose-p:leading-relaxed prose-pre:p-0"
              )}>
                {content || (isStreaming ? '' : 'No content')}
                
                {/* Minimalist typing indicator while streaming */}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 bg-gray-400 opacity-70 animate-pulse"></span>
                )}
              </div>
            </div>
            
            {/* Timestamp below message */}
            <span className="text-xs text-gray-500 mt-1 px-1">
              {formatTime(timestamp)}
            </span>
          </div>
          
          {/* Avatar for user (only show on user messages) */}
          {sender === 'user' && (
            <div className="ml-4 mt-1 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Format timestamp to a readable time
const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * MessageSkeleton component shows animated loading placeholders that look like messages
 */
export const MessageSkeleton: React.FC<{ count?: number; }> = ({
  count = 1,
}) => {
  return (
    <div className="w-full py-6 bg-[#1a1a1a] border-b border-gray-800">
      <div className="max-w-3xl mx-auto w-full px-4 md:px-6">
        <div className="flex items-start">
          {/* Avatar skeleton */}
          <div className="mr-4 mt-1 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 flex items-center justify-center">
              <span className="text-xs text-blue-300">AI</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 max-w-[85%]">
            <div className="px-4 py-3 rounded-2xl bg-[#2c2c2c]">
              {/* Content skeleton with multiple lines */}
              <div className="space-y-2.5">
                <div className="h-3.5 bg-gray-700 rounded-md w-4/5 animate-pulse"></div>
                <div className="h-3.5 bg-gray-700 rounded-md w-3/4 animate-pulse"></div>
                <div className="h-3.5 bg-gray-700 rounded-md w-2/3 animate-pulse"></div>
              </div>
            </div>
            
            {/* Time skeleton */}
            <div className="w-12 h-3 bg-gray-700/30 rounded-md ml-1"></div>
          </div>
        </div>
      </div>
    </div>
  )
}