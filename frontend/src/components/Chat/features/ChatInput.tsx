'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInputProps } from './types';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoginRequired } from '@/components/Auth/LoginRequired';
import { cn } from '@/lib/utils';
import { RiSendPlaneFill, RiCloseLine, RiAttachmentLine } from '@remixicon/react';

/**
 * ChatInput component provides a textarea for user message input
 * Enhanced with better accessibility and keyboard handling
 */
export const ChatInput = ({ onSendMessage, isLoading, onCancel, disabled = false }: ChatInputProps) => {
    // Input state
    const [input, setInput] = useState('');

    // Error state
    const [error, setError] = useState<string | null>(null);

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

    // Focus textarea when loading state changes
    useEffect(() => {
        if (!isLoading && textareaRef.current && isAuthenticated && !disabled) {
            // Only focus if the user is on the page
            if (document.hasFocus()) {
                textareaRef.current.focus();
            }
        }
    }, [isLoading, isAuthenticated, disabled]);

    // Handle form submission with proper validation and error handling
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Check if user is authenticated before submitting
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }

        // Check input validity
        if (!input.trim()) {
            setError('Please enter a message');
            return;
        }

        if (isLoading || disabled) return;

        try {
            onSendMessage(input);
            setInput('');
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
        }
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

        // Clear error when user starts typing
        if (error) setError(null);

        setInput(e.target.value);
    };

    // Handle key down in textarea with accessibility in mind
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (without shift for newlines)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }

        // Cancel on Escape if loading
        if (e.key === 'Escape' && isLoading) {
            e.preventDefault();
            onCancel();
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
                <div className="mb-2 flex justify-between items-center">
                    <div className="flex items-center text-muted-foreground text-sm gap-1 pt-1">
                        <button
                            type="button"
                            className="px-3 py-1 rounded-md bg-muted text-foreground flex items-center gap-1 hover:bg-muted/80 transition-colors"
                            disabled={isLoading || disabled}
                        >
                            {/* Status indicator - properly positioned to avoid overlap */}
                            <div
                                className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-orange-500' : 'bg-green-500'}`}
                            ></div>
                            <span className="text-xs text-muted-foreground">
                                {isLoading ? 'Processing...' : 'Ready'}
                            </span>
                        </button>
                    </div>

                    {/* Show error message */}
                    {error && <div className="text-xs text-destructive animate-fade-in-up">{error}</div>}
                </div>

                <div
                    className={cn(
                        'relative flex items-center bg-card rounded-xl border overflow-hidden transition-colors',
                        error ? 'border-destructive' : 'border-[var(--border)]',
                        disabled && 'opacity-70',
                    )}
                >
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onFocus={handleTextareaFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? 'Input disabled' : 'Message your assistant...'}
                        disabled={isLoading || disabled}
                        rows={1}
                        className={cn(
                            'w-full py-3 px-4 pr-12 resize-none outline-none bg-transparent',
                            'text-foreground placeholder:text-muted-foreground text-sm',
                            'disabled:cursor-not-allowed',
                        )}
                        style={{ minHeight: '44px', maxHeight: '160px' }}
                        aria-label="Message input"
                    />

                    <div className="absolute right-0 h-full flex items-center gap-1 pr-2">
                        {/* Attachment button - only shown when not loading */}
                        {!isLoading && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground"
                                aria-label="Attachments"
                                disabled={disabled}
                                onClick={() => !isAuthenticated && setShowLoginPrompt(true)}
                            >
                                <RiAttachmentLine size={20} className="rotate-45" />
                            </Button>
                        )}

                        {/* Cancel or send button based on loading state */}
                        {isLoading ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onCancel}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive"
                                aria-label="Cancel"
                            >
                                <RiCloseLine size={20} />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                disabled={!input.trim() || disabled}
                                className={cn(
                                    'p-1.5 rounded-md',
                                    input.trim() && !disabled
                                        ? 'text-[var(--heart-blue-500)] hover:bg-muted cursor-pointer'
                                        : 'text-muted-foreground/50 cursor-default',
                                )}
                                aria-label="Send message"
                            >
                                <RiSendPlaneFill size={20} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Accessibility status for screen readers */}
                <div className="sr-only" aria-live="polite">
                    {isLoading ? 'AI is processing your message' : ''}
                </div>
            </form>
        </div>
    );
};
