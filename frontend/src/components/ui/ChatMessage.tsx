"use client"

import React, { useState, useEffect } from 'react'
import { Card } from './card'
import { cn } from '@/lib/utils'

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
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </span>
              )}
              {content}
              
              {/* Show typing indicator while streaming */}
              {isStreaming && (
                <span className="inline-flex items-center ml-1">
                  <span className="typing-dot w-1 h-1 rounded-full bg-current mx-0.5"></span>
                  <span className="typing-dot w-1 h-1 rounded-full bg-current mx-0.5"></span>
                  <span className="typing-dot w-1 h-1 rounded-full bg-current mx-0.5"></span>
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * Typing indicator shown while waiting for the AI response
 */
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1 px-4 py-3 rounded-md bg-muted/50 w-24 mb-4">
      <div className="typing-dot w-2 h-2 rounded-full bg-[color:var(--heart-cyan-500)]"></div>
      <div className="typing-dot w-2 h-2 rounded-full bg-[color:var(--heart-cyan-500)]"></div>
      <div className="typing-dot w-2 h-2 rounded-full bg-[color:var(--heart-cyan-500)]"></div>
    </div>
  )
}