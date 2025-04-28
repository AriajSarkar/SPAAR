"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInputProps } from './types';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoginRequired } from '@/components/Auth/LoginRequired';
import { cn } from '@/lib/utils';
// Import Remix Icons
import { RiSendPlaneFill, RiCloseLine, RiAttachmentLine } from '@remixicon/react';

/**
 * ChatInput component provides a textarea for user message input
 * Designed to appear in center when no messages, and animate to bottom with messages
 * Now checks for authenticated state before allowing input
 */
export const ChatInput = ({
    onSendMessage,
    isLoading,
    onCancel
}: ChatInputProps) => {
    // Input state
    const [input, setInput] = useState('');
    
    // Get authentication state
    const { isAuthenticated } = useAuth();
    
    // Show login prompt state - becomes true only when user tries to input
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    
    // Ref for textarea element
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Auto-adjust the height of the textarea based on content
     */
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset height temporarily to get the correct scrollHeight
        textarea.style.height = 'auto';

        // Set the height based on scrollHeight (with a max height of 160px/10rem)
        const newHeight = Math.min(textarea.scrollHeight, 160);
        textarea.style.height = `${newHeight}px`;
    };

    // Adjust textarea height when input changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check if user is authenticated before submitting
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    // Handle textarea focus - check authentication
    const handleTextareaFocus = () => {
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            // Blur the textarea to stop focus
            textareaRef.current?.blur();
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // If not authenticated, show login prompt
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        
        setInput(e.target.value);
    };

    // Handle key down in textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // If showing login prompt, render the login required component
    if (showLoginPrompt) {
        return (
            <div className="flex justify-center py-4">
                <LoginRequired message="You need to log in to chat with the AI assistant." />
            </div>
        );
    }

    return (
        <div className="relative w-full">
            <form onSubmit={handleSubmit} className="relative">
                {/* Model selector and options buttons */}
                <div className="mb-2 flex justify-between">
                    <div className="flex items-center text-muted-foreground text-sm gap-1">
                        <button className="px-3 py-1 rounded-md bg-muted text-foreground flex items-center gap-1 hover:bg-muted/80 transition-colors">
                            <span className="w-2 h-2 bg-[var(--heart-blue-500)] rounded-full"></span>
                            AI Assistant
                        </button>
                    </div>
                </div>

                <div className="relative flex items-center bg-card rounded-xl border border-[var(--border)] overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onFocus={handleTextareaFocus}
                        onKeyDown={handleKeyDown}
                        placeholder="Message your assistant..."
                        disabled={isLoading}
                        rows={1}
                        className="w-full py-3 px-4 pr-12 resize-none outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-sm"
                        style={{ minHeight: '44px', maxHeight: '160px' }}
                    />

                    <div className="absolute right-0 h-full flex items-center gap-1 pr-2">
                        {/* Attachment button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground"
                            aria-label="Attachments"
                            onClick={() => !isAuthenticated && setShowLoginPrompt(true)}
                        >
                            <RiAttachmentLine size={20} className="rotate-45" />
                        </Button>

                        {isLoading ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onCancel}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground"
                                aria-label="Cancel"
                            >
                                <RiCloseLine size={20} />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                disabled={!input.trim()}
                                className={cn(
                                  "p-1.5 rounded-md",
                                  input.trim()
                                    ? "text-foreground hover:bg-muted cursor-pointer"
                                    : "text-muted-foreground/50 cursor-default"
                                )}
                                aria-label="Send message"
                            >
                                <RiSendPlaneFill size={20} />
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};