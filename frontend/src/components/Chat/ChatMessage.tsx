"use client"

import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { cn } from '@/lib/utils'
// Import Remix Icons
import { RiInformationLine } from '@remixicon/react'

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
   * Motion effects for entrance animation
   */
  animationDelay?: number
  /**
   * Whether the message represents an error state
   */
  error?: boolean
}

/**
 * ChatMessage component displays a single message in the chat interface
 * Uses heart-themed styling with different colors for user and bot
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  isStreaming = false,
  timestamp = new Date(),
  animationDelay = 0,
  error = false
}) => {
  const [visible, setVisible] = useState(false)

  // Animate the message in with a slight delay between messages
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
    }, animationDelay)

    return () => clearTimeout(timer)
  }, [animationDelay])

  // Format timestamp to a readable time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div 
      className={cn(
        'w-full mb-4 transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'both'
      }}
    >
      <div className={cn(
        'flex',
        sender === 'user' ? 'justify-end' : 'justify-start'
      )}>
        <Card 
          className={cn(
            'max-w-[85%] sm:max-w-[75%] shadow-md animate-fade-in-up',
            sender === 'user' 
              ? 'border-[color:var(--heart-blue-500)] bg-[color:var(--heart-blue-500)]/10' 
              : error 
                ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/20' 
                : 'border-[color:var(--heart-cyan-500)] bg-[color:var(--heart-cyan-500)]/5',
          )}
        >
          <div className="flex flex-col px-4 py-3">
            <div className="flex justify-between items-center mb-1">
              <span className={cn(
                "text-xs font-medium",
                sender === 'user' 
                  ? 'text-[color:var(--heart-blue-700)]' 
                  : error
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[color:var(--heart-cyan-700)]'
              )}>
                {sender === 'user' ? 'You' : error ? 'Error' : 'AI Assistant'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(timestamp)}
              </span>
            </div>
            
            <div className={cn(
              "text-sm whitespace-pre-wrap break-words",
              error && "text-red-600 dark:text-red-400"
            )}>
              {error && (
                <span className="inline-flex items-center mb-1">
                  <RiInformationLine size={16} className="mr-1" />
                </span>
              )}
              {content}
              
              {/* Enhanced animated typing indicator while streaming */}
              {isStreaming && (
                <StreamingIndicator />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * StreamingIndicator component shows an animated typing effect while message is streaming
 * Replaces the simple vertical bar with a heart-themed skeleton animation
 */
export const StreamingIndicator: React.FC = () => {
  return (
    <span className="inline-flex items-center ml-1 align-middle">
      <span 
        className="inline-block h-4 w-16 rounded-full bg-[var(--heart-cyan-500)]/10 overflow-hidden relative" 
      >
        <span 
          className="absolute inset-0 h-full rounded-full bg-[var(--heart-cyan-500)]/30"
          style={{ 
            width: "30%",
            animation: "streamingSkeletonSlide 1.2s ease-in-out infinite",
            transformOrigin: "left center",
          }}
        />
      </span>
    </span>
  )
}

/**
 * Typing indicator shown while waiting for the AI response
 */
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-md bg-[color:var(--heart-cyan-500)]/5 border border-[color:var(--heart-cyan-500)]/10 w-auto max-w-[180px] mb-4">
      <div className="h-3 w-3 rounded-full animate-pulse bg-[color:var(--heart-cyan-500)]/40"></div>
      <div className="h-3 w-3 rounded-full animate-pulse bg-[color:var(--heart-cyan-500)]/60" style={{ animationDelay: "0.2s" }}></div>
      <div className="h-3 w-3 rounded-full animate-pulse bg-[color:var(--heart-cyan-500)]/80" style={{ animationDelay: "0.4s" }}></div>
      <div className="text-xs ml-1 text-[color:var(--heart-cyan-700)]">Thinking</div>
    </div>
  )
}

/**
 * MessageSkeleton component shows animated loading placeholders that look like messages
 * Provides a more visually informative loading state with heart-themed styling
 */
export const MessageSkeleton: React.FC<{ count?: number; sender?: 'user' | 'bot' }> = ({
  count = 1,
  sender = 'bot'
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="w-full mb-4"
          style={{ 
            animationDelay: `${index * 150}ms`,
            animationFillMode: 'both'
          }}
        >
          <div className={cn('flex', sender === 'user' ? 'justify-end' : 'justify-start')}>
            <Card
              className={cn(
                'max-w-[85%] sm:max-w-[75%] shadow-sm',
                sender === 'user'
                  ? 'border-[color:var(--heart-blue-500)]/30 bg-[color:var(--heart-blue-500)]/5'
                  : 'border-[color:var(--heart-cyan-500)]/30 bg-[color:var(--heart-cyan-500)]/5',
              )}
            >
              <div className="flex flex-col px-4 py-3">
                <div className="flex justify-between items-center mb-2">
                  {/* Sender name skeleton */}
                  <div 
                    className={cn(
                      "h-3 rounded-full animate-pulse",
                      sender === 'user' 
                        ? 'bg-[color:var(--heart-blue-700)]/20 w-10' 
                        : 'bg-[color:var(--heart-cyan-700)]/20 w-16'
                    )}
                  />
                  
                  {/* Timestamp skeleton */}
                  <div className="h-3 w-12 rounded-full bg-muted/50 animate-pulse" />
                </div>
                
                {/* Content skeleton - different sizes based on index for variety */}
                <div className="space-y-2.5">
                  <div 
                    className={cn(
                      "h-4 rounded-full animate-pulse",
                      sender === 'user' 
                        ? 'bg-[color:var(--heart-blue-500)]/20' 
                        : 'bg-[color:var(--heart-cyan-500)]/20',
                      index % 3 === 0 ? 'w-full' : index % 3 === 1 ? 'w-5/6' : 'w-4/5'
                    )}
                  />
                  
                  {/* Only show multiple lines for bot messages or on certain indices */}
                  {(sender === 'bot' || index % 2 === 0) && (
                    <div 
                      className={cn(
                        "h-4 rounded-full animate-pulse",
                        sender === 'user' 
                          ? 'bg-[color:var(--heart-blue-500)]/15' 
                          : 'bg-[color:var(--heart-cyan-500)]/15',
                        index % 2 === 0 ? 'w-3/4' : 'w-2/3'
                      )}
                      style={{ animationDelay: '100ms' }}
                    />
                  )}
                  
                  {/* Add a third line for bot messages sometimes */}
                  {sender === 'bot' && (
                    <div 
                      className="h-4 w-1/2 rounded-full bg-[color:var(--heart-cyan-500)]/10 animate-pulse"
                      style={{ animationDelay: '200ms' }}
                    />
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ))}
    </>
  )
}