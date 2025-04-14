"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { FloatingTooltip } from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/Spinner';
import { ChatInputProps } from './types';
// Import Remix Icons
import { RiAttachmentLine, RiCloseLine, RiSendPlaneFill } from '@remixicon/react';

/**
 * ChatInput component for message input with animated vanishing text effect
 * Features heart-themed styling and smooth transitions
 */
export const ChatInput = ({
    onSendMessage,
    isLoading,
    onCancel
}: ChatInputProps) => {
    // Input state
    const [input, setInput] = useState('');
    // Vanishing animation state
    const [isVanishing, setIsVanishing] = useState(false);

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const newDataRef = useRef<any[]>([]);

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

    /**
     * Draw text onto canvas for vanishing animation
     */
    const drawTextToCanvas = useCallback(() => {
        if (!textareaRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Get textarea dimensions and position for precise canvas placement
        const textareaRect = textareaRef.current.getBoundingClientRect();
        const computedStyles = getComputedStyle(textareaRef.current);
        const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
        const lineHeight = fontSize * 1.2;
        const paddingLeft = parseFloat(computedStyles.getPropertyValue("padding-left"));

        // Set canvas dimensions to match textarea content area
        canvas.width = textareaRect.width - paddingLeft;
        canvas.height = textareaRect.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use the exact font from textarea for perfect matching
        ctx.font = `${fontSize}px ${computedStyles.fontFamily}`;
        ctx.fillStyle = "#FFF";

        // Split by lines to render multiline text with exact positioning
        const lines = input.split('\n');
        const paddingTop = parseFloat(computedStyles.getPropertyValue("padding-top"));

        // Draw text at exact position it appears in textarea
        lines.forEach((line, index) => {
            ctx.fillText(line, 0, paddingTop + (index * lineHeight));
        });

        // Process image data with higher resolution for smoother animation
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;
        const newData = [];

        // Generate more particles for better visual effect but optimized for performance
        const pixelSkip = window.innerWidth < 768 ? 3 : 2; // Skip pixels for performance

        for (let y = 0; y < canvas.height; y += pixelSkip) {
            let i = 4 * y * canvas.width;
            for (let x = 0; x < canvas.width; x += pixelSkip) {
                let p = i + 4 * x;
                if (
                    pixelData[p] > 10 ||  // More lenient detection for better particle coverage
                    pixelData[p + 1] > 10 ||
                    pixelData[p + 2] > 10
                ) {
                    newData.push({
                        x,
                        y,
                        color: [
                            pixelData[p],
                            pixelData[p + 1],
                            pixelData[p + 2],
                            pixelData[p + 3],
                        ],
                    });
                }
            }
        }

        // Convert to optimized particle data
        newDataRef.current = newData.map(({ x, y, color }) => ({
            x,
            y,
            r: Math.random() * 1.5 + 0.5, // Varied particle size for better effect
            vx: (Math.random() - 0.5) * 3, // Horizontal velocity
            vy: (Math.random() - 0.5) * 3, // Vertical velocity
            color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
        }));
    }, [input]);

    /**
     * Animate particles dispersing
     */
    const animateVanishingText = useCallback(() => {
        const userInput = input;

        // Optimize animation with RAF and timestamp for smoother effect
        let startTime = performance.now();
        const totalDuration = 600; // ms

        const animateFrame = (timestamp: number) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                // Render and update particles
                newDataRef.current.forEach((p) => {
                    // Accelerate particle movement as animation progresses
                    p.x += p.vx * (1 + progress);
                    p.y += p.vy * (1 + progress);
                    p.r -= 0.03 + (progress * 0.05);

                    // Only draw particles that are still visible
                    if (p.r > 0) {
                        ctx.beginPath();
                        ctx.rect(p.x, p.y, p.r, p.r);

                        // Fade out particles gradually
                        const opacity = 1 - progress;
                        const color = p.color.replace('rgba', '').replace(')', ', ' + opacity + ')');
                        ctx.fillStyle = 'rgba' + color;
                        ctx.fill();
                    }
                });

                // Continue animation if not complete
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    // Animation complete
                    setIsVanishing(false);
                    // Send the message after animation completes
                    onSendMessage(userInput);
                }
            }
        };

        // Start animation loop
        requestAnimationFrame(animateFrame);
    }, [input, onSendMessage]);

    /**
     * Start the vanishing animation and submit the message
     */
    const vanishAndSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading || isVanishing) return;

        // Start animation
        setIsVanishing(true);

        setInput('');

        // Reset textarea height immediately
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Draw text and start animation in next frame for smooth transition
        requestAnimationFrame(() => {
            drawTextToCanvas();
            animateVanishingText();
        });

    }, [input, isLoading, isVanishing, drawTextToCanvas, animateVanishingText]);

    // Handle keyboard shortcuts for form submission
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey && document.activeElement === textareaRef.current) {
                e.preventDefault();
                vanishAndSubmit(e as unknown as React.FormEvent);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [vanishAndSubmit]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    // Handle key down in textarea
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            vanishAndSubmit(e);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm pb-4 pt-2 border-t border-[var(--heart-blue-500)]/10 z-20">
            <div className="max-w-4xl mx-auto px-4">
                {/* Message input with animations */}
                <motion.form
                    onSubmit={vanishAndSubmit}
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="relative flex flex-col bg-background rounded-xl border-2 border-[var(--heart-blue-500)]/20 focus-within:border-[var(--heart-blue-500)]/40 dark:border-[var(--heart-blue-700)]/50 dark:focus-within:border-[var(--heart-cyan-500)]/50 shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all duration-300">
                        {/* Gradient top border accent */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-[var(--heart-blue-500)]/60 to-[var(--heart-cyan-500)]/60"></div>

                        {/* Textarea container at the top */}
                        <div className="w-full relative p-3 pb-1">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className={`w-full py-1.5 bg-transparent resize-none outline-none focus:outline-none min-h-[48px] max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--heart-blue-500)]/20 scrollbar-track-transparent text-sm md:text-base transition-colors duration-75 ${isVanishing ? 'text-transparent dark:text-transparent' : ''
                                    }`}
                                disabled={isLoading || isVanishing}
                                rows={1}
                                aria-label="Chat message"
                            />
                            {/* Canvas for vanishing text effect */}
                            <canvas
                                className={`absolute pointer-events-none z-20 left-3 top-[13px] origin-top-left ${isVanishing ? 'opacity-100' : 'opacity-0'
                                    } transition-opacity duration-150 filter invert dark:invert-0`}
                                ref={canvasRef}
                            />
                        </div>

                        {/* Action buttons row with file attachment on the left */}
                        <div className="flex items-center justify-between p-2">
                            {/* File upload icon button with tooltip */}
                            <FloatingTooltip content="Attach a file" position="top">
                                <button
                                    type="button"
                                    className="flex items-center justify-center p-2 text-[var(--heart-blue-500)] dark:text-[var(--heart-blue-500)]/80 hover:text-[var(--heart-blue-700)] dark:hover:text-[var(--heart-blue-500)] transition-colors"
                                    aria-label="Attach a file"
                                >
                                    <RiAttachmentLine 
                                        size={20} 
                                        className="transition-transform hover:rotate-12"
                                    />
                                </button>
                            </FloatingTooltip>

                            {/* Right side buttons group */}
                            <div className="flex items-center">
                                {/* Cancel button with tooltip */}
                                <AnimatePresence>
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <FloatingTooltip content="Stop generating" position="top">
                                                <Button
                                                    type="button"
                                                    onClick={onCancel}
                                                    className="rounded-lg h-10 px-3 mr-2 transition-all border border-[var(--heart-blue-500)]/30 hover:bg-[var(--heart-blue-500)]/10"
                                                    aria-label="Cancel response"
                                                >
                                                    <RiCloseLine size={16} className="mr-1.5" />
                                                    Cancel
                                                </Button>
                                            </FloatingTooltip>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Send button with animated gradient */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !input.trim() || isVanishing}
                                    className={`
                  rounded-lg h-10 px-4 transition-all 
                  ${(!input.trim() && !isLoading)
                                            ? 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] opacity-70'
                                            : 'bg-gradient-to-r from-[var(--heart-blue-500)] to-[var(--heart-cyan-500)] hover:opacity-90 text-white shadow-md'}
                `}
                                    aria-label="Send message"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center">
                                            <Spinner size="sm" variant="blue" className="mr-2" />
                                            <span className="text-sm md:text-base">Sending</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <span className="text-sm md:text-base mr-2">Send</span>
                                            <RiSendPlaneFill 
                                                size={16} 
                                                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                            />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Keyboard shortcuts with improved styling */}
                    <motion.p
                        className="mt-2 text-xs text-center text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <span>Press </span>
                        <kbd className="px-1.5 py-0.5 text-xs border rounded-md bg-muted font-mono">Enter</kbd>
                        <span> to send, </span>
                        <kbd className="px-1.5 py-0.5 text-xs border rounded-md bg-muted font-mono">Shift + Enter</kbd>
                        <span> for a new line</span>
                    </motion.p>
                </motion.form>
            </div>
        </div>
    );
};