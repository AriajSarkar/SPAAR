"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInputProps } from './types';
// Import Remix Icons
import { RiSendPlaneFill, RiCloseLine, RiAttachmentLine } from '@remixicon/react';

/**
 * ChatInput component provides a textarea for user message input
 * Designed to appear in center when no messages, and animate to bottom with messages
 */
export const ChatInput = ({
    onSendMessage,
    isLoading,
    onCancel
}: ChatInputProps) => {
    // Input state
    const [input, setInput] = useState('');
    
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
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    // Handle key down in textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="relative w-full">
            <form onSubmit={handleSubmit} className="relative">
                {/* Model selector and options buttons */}
                <div className="mb-2 flex justify-between">
                    <div className="flex items-center text-gray-400 text-sm gap-1">
                        <button className="px-3 py-1 rounded-md bg-[#2c2c2c] text-gray-300 flex items-center gap-1 hover:bg-[#343434]">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            AI Assistant
                        </button>
                    </div>
                </div>

                <div className="relative flex items-center bg-[#202123] rounded-xl border border-gray-700 overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Message your assistant..."
                        disabled={isLoading}
                        rows={1}
                        className="w-full py-3 px-4 pr-12 resize-none outline-none bg-transparent text-gray-200 placeholder-gray-500 text-sm"
                        style={{ minHeight: '44px', maxHeight: '160px' }}
                    />

                    <div className="absolute right-0 h-full flex items-center gap-1 pr-2">
                        {/* Attachment button */}
                        <Button
                            type="button"
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-400 bg-transparent hover:bg-[#2c2c2c]"
                            aria-label="Attachments"
                        >
                            <RiAttachmentLine size={20} className="rotate-45" />
                        </Button>

                        {isLoading ? (
                            <Button
                                type="button"
                                onClick={onCancel}
                                className="p-1.5 rounded-md text-gray-500 hover:text-gray-400 bg-transparent hover:bg-[#2c2c2c]"
                                aria-label="Cancel"
                            >
                                <RiCloseLine size={20} />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={!input.trim()}
                                className={`p-1.5 rounded-md bg-transparent ${
                                    input.trim()
                                        ? 'text-gray-300 hover:bg-[#2c2c2c] cursor-pointer'
                                        : 'text-gray-600 cursor-default'
                                }`}
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