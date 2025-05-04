'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RiChat1Line, RiDeleteBinLine, RiMoreLine } from '@remixicon/react';
import { ConversationSummary } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ChatHistoryItemProps {
    conversation: ConversationSummary;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}

export function ChatHistoryItem({ conversation, isActive, onClick, onDelete }: ChatHistoryItemProps) {
    const [showDelete, setShowDelete] = useState(false);

    // Format date to be more readable
    const formatDate = (dateString: string) => {
        // Handle ISO strings with timezone offsets
        let date;
        try {
            date = new Date(dateString);
            // Check if date is invalid
            if (isNaN(date.getTime())) {
                return '';
            }
        } catch {
            console.error('Invalid date string:', dateString);
            return '';
        }

        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div
            className={cn(
                'relative group flex items-start p-2 rounded-md cursor-pointer mb-1 hover:bg-muted/70 transition-colors',
                isActive && 'bg-muted border-l-2 border-[var(--heart-blue-500)]',
            )}
        >
            {/* Main content that selects the conversation */}
            <div className="flex-1 overflow-hidden" onClick={onClick}>
                <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-md bg-[var(--heart-blue-500)]/10">
                        <RiChat1Line className="h-4 w-4 text-[var(--heart-blue-500)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{conversation.title || 'New conversation'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {conversation.preview || 'No messages yet'}
                        </p>
                    </div>
                </div>
                {conversation.lastMessageDate && (
                    <div className="text-xs text-muted-foreground mt-1 ml-8">
                        {formatDate(conversation.lastMessageDate)}
                    </div>
                )}
            </div>

            {/* Delete button with animation */}
            <div className="shrink-0 flex items-center">
                {showDelete ? (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                            setShowDelete(false);
                        }}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"
                        title="Delete conversation"
                    >
                        <RiDeleteBinLine className="h-4 w-4" />
                    </motion.button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDelete(true);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:text-foreground rounded-md"
                        title="Options"
                    >
                        <RiMoreLine className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
