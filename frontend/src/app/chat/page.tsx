"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage, TypingIndicator } from '@/components/ui/ChatMessage';
import { FloatingCardStack } from '@/components/ui/FloatingCardStack';
import { Spinner } from '@/components/ui/Spinner';
import { FloatingNavbar } from '@/components/Navbar/FloatingNavbar';
import { motion, AnimatePresence } from 'motion/react';
import { FloatingTooltip } from '@/components/ui/tooltip';

// Define message type for our chat
interface Message {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    error?: boolean;
    isRetryable?: boolean;
}

/**
 * Main chat page component
 * Features a message input and chat window with animated messages
 * Uses heart-themed styling for a consistent brand experience
 */
export default function ChatPage() {
    // State for messages
    const [messages, setMessages] = useState<Message[]>([]);
    // State for the current message being typed
    const [input, setInput] = useState('');
    // Loading state
    const [isLoading, setIsLoading] = useState(false);
    // Streaming state (when message is coming in chunks)
    const [isStreaming, setIsStreaming] = useState(false);
    // Current streaming message content
    const [currentStreamContent, setCurrentStreamContent] = useState('');
    // Track failed messages for retry
    const [, setFailedMessageIndex] = useState<number | null>(null);

    // Refs
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    // New refs for vanishing text animation
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const newDataRef = useRef<any[]>([]);
    const [isVanishing, setIsVanishing] = useState(false);

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

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, currentStreamContent]);

    // Adjust textarea height when input changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    // Cleanup function for aborting ongoing requests when component unmounts
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Generate a unique ID for messages
    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    /**
     * Send a message to the AI and process the response
     * Handles multiple response formats from the n8n webhook
     * 
     * @param messageText - The user's message to send to the API
     * @returns The AI's response as a string
     */
    const sendMessageToAI = async (messageText: string): Promise<string> => {
        const encodedMsg = encodeURIComponent(messageText);

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        try {
            // Call the API with the encoded message - no timeout
            const response = await fetch(`/api/chat/${encodedMsg}`, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Only propagate backend errors with their original message
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();

            // Handle different response formats that might come from the n8n webhook

            // Format 1: Array with objects containing 'output' property
            if (Array.isArray(data) && data.length > 0) {
                if (data[0].output) {
                    return data[0].output;
                }
                // If data is an array but doesn't have the expected structure
                return JSON.stringify(data);
            }

            // Format 2: Object with 'output' array property
            if (data.output && Array.isArray(data.output) && data.output.length > 0) {
                if (typeof data.output[0] === 'object' && data.output[0].output) {
                    return data.output[0].output;
                }
                if (typeof data.output[0] === 'string') {
                    return data.output[0];
                }
            }

            // Format 3: Direct 'response' property
            if (data.response) {
                return data.response;
            }

            // If none of the expected formats match, return the data as a string
            return typeof data === 'string'
                ? data
                : JSON.stringify(data) || "I'm sorry, I couldn't generate a response at this time.";
        } catch (error: any) {
            // Clear the abort controller reference if it's been used
            abortControllerRef.current = null;

            // Only re-throw errors - no special handling for timeouts
            throw error;
        }
    };

    /**
     * Retry a failed message
     * @param userMessageIndex The index of the user message to retry
     */
    const handleRetry = async (userMessageIndex: number) => {
        if (isLoading || userMessageIndex < 0 || userMessageIndex >= messages.length) return;

        // Get the user message to retry
        const userMessage = messages[userMessageIndex];
        if (userMessage.sender !== 'user') return;

        // Remove all messages after the user message (including any error responses)
        const remainingMessages = messages.slice(0, userMessageIndex + 1);
        setMessages(remainingMessages);
        setFailedMessageIndex(null);

        // Call the API again with the same message
        await processBotResponse(userMessage.content);
    };

    /**
     * Process the bot response separately to allow for retries
     */
    const processBotResponse = async (userInput: string) => {
        // Start loading state
        setIsLoading(true);

        try {
            // Create a bot message first to prepare for streaming response
            const botMessage: Message = {
                id: generateId(),
                content: '',
                sender: 'bot',
                timestamp: new Date(),
            };

            // Add the empty bot message
            setMessages((prev) => [...prev, botMessage]);

            // Call the API and get response
            setIsStreaming(true);
            const botResponse = await sendMessageToAI(userInput);

            // Simulate streaming text for heart-themed streaming experience
            let currentText = '';
            const words = botResponse.split(' ');

            for (let i = 0; i < words.length; i++) {
                // Check if streaming has been aborted
                if (!isStreaming) break;

                currentText += (i > 0 ? ' ' : '') + words[i];
                setCurrentStreamContent(currentText);

                // Wait a short time between words for a natural feel
                await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 50));
            }

            // Update the bot message with full content
            setMessages((prev) =>
                prev.map(msg =>
                    msg.id === botMessage.id
                        ? { ...msg, content: botResponse }
                        : msg
                )
            );

            // End streaming
            setCurrentStreamContent('');
            setIsStreaming(false);

        } catch (error: any) {
            console.error('Error fetching chat response:', error);

            // Find the index of the last user message
            const lastUserMsgIndex = messages.length - 1;
            setFailedMessageIndex(lastUserMsgIndex);

            // Only show backend errors
            setMessages((prev) => [
                ...prev,
                {
                    id: generateId(),
                    content: error.message || "Backend error occurred. Please try again later.",
                    sender: 'bot',
                    timestamp: new Date(),
                    error: true,
                    isRetryable: true
                }
            ]);

            // Cancel any ongoing streaming
            setIsStreaming(false);
            setCurrentStreamContent('');

        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Draw text onto canvas for vanishing animation - optimized for instant display
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
     * Animate particles dispersing - optimized for better performance
     */
    const animateVanishingText = useCallback(() => {
        // Create user message immediately before animation
        const userMessage: Message = {
            id: generateId(),
            content: input,
            sender: 'user',
            timestamp: new Date(),
        };

        const userInput = input;
        setMessages((prev) => [...prev, userMessage]);

        // Start processing bot response immediately in parallel with animation
        // This removes the waiting period
        processBotResponse(userInput);

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
                newDataRef.current.forEach((p, i) => {
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
                }
            }
        };

        // Start animation loop
        requestAnimationFrame(animateFrame);
    }, [input, processBotResponse]);

    /**
     * Start the vanishing animation and submit the message - optimized for instant response
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

    // Use vanishAndSubmit instead of handleSubmit
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

    // Retain original handleSubmit for compatibility but redirect to vanishAndSubmit
    const handleSubmit = (e: React.FormEvent) => {
        vanishAndSubmit(e);
    };

    /**
     * Cancel the current streaming response
     */
    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Reset streaming state
        setIsStreaming(false);
        setCurrentStreamContent('');
        setIsLoading(false);

        // Update the last bot message to show it was cancelled
        setMessages(prev => {
            // Find the last bot message
            const lastBotIndex = [...prev].reverse().findIndex(msg => msg.sender === 'bot');
            if (lastBotIndex === -1) return prev;

            const actualIndex = prev.length - 1 - lastBotIndex;

            // Clone the messages array
            const updated = [...prev];
            // Mark the message as cancelled if it's empty (still streaming)
            if (!updated[actualIndex].content) {
                updated[actualIndex] = {
                    ...updated[actualIndex],
                    content: "Response cancelled. You can ask another question.",
                    error: true
                };
            }

            return updated;
        });
    };

    /**
     * Handle keyboard shortcuts for form submission
     * Submits on Enter (without Shift) and adds a new line on Shift+Enter
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <FloatingNavbar />

            {/* Fixed top header area */}
            <div className="fixed top-0 left-0 right-0 pt-16 pb-2 bg-background/80 backdrop-blur-sm z-10">
                {/* Heart-themed gradient heading with subtle animation */}
                <motion.h1
                    className="text-2xl font-bold text-center bg-gradient-to-r from-[var(--heart-blue-500)] to-[var(--heart-cyan-500)] inline-block text-transparent bg-clip-text w-full"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Heart Chat
                </motion.h1>
            </div>

            {/* Main content area with fixed header and footer */}
            <main className="flex flex-col w-full h-full pt-[72px] pb-[140px]">
                {/* Scrollable messages area - fills available space */}
                <div className="flex-1 overflow-hidden mx-auto w-full max-w-4xl px-4">
                    <FloatingCardStack
                        className="h-full overflow-hidden flex flex-col rounded-2xl shadow-lg border border-[var(--heart-blue-500)]/10"
                        patternStyle="dots"
                    >
                        {/* Messages area with improved scrolling */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6 md:px-6"
                        >
                            {messages.length === 0 ? (
                                <motion.div
                                    className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-[var(--heart-blue-500)]/20 to-[var(--heart-cyan-500)]/20 flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-[var(--heart-blue-500)]"
                                        >
                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-medium mb-2 bg-gradient-to-r from-[var(--heart-blue-500)] to-[var(--heart-cyan-500)] inline-block text-transparent bg-clip-text">Welcome to Heart Chat</h2>
                                    <p className="text-sm max-w-sm">Send a message below to start your conversation with our heart-themed AI assistant</p>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col space-y-6">
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg, index) => (
                                            <motion.div
                                                key={msg.id}
                                                className="flex flex-col"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <ChatMessage
                                                    content={
                                                        isStreaming && msg.id === messages[messages.length - 1].id
                                                            ? currentStreamContent
                                                            : msg.content
                                                    }
                                                    sender={msg.sender}
                                                    timestamp={msg.timestamp}
                                                    isStreaming={
                                                        isStreaming && msg.id === messages[messages.length - 1].id
                                                    }
                                                    animationDelay={50}
                                                    error={msg.error}
                                                />

                                                {/* Enhanced retry button with tooltip */}
                                                {msg.error && msg.isRetryable && (
                                                    <motion.div
                                                        className="flex justify-end mt-1 mb-2"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                    >
                                                        <FloatingTooltip
                                                            content="Try sending this message again"
                                                            position="top"
                                                        >
                                                            <Button
                                                                onClick={() => handleRetry(index - 1)}
                                                                className="text-xs px-3 py-1 h-7 bg-[var(--heart-blue-500)]/10 hover:bg-[var(--heart-blue-500)]/20 text-[var(--heart-blue-500)] rounded-full transition-colors"
                                                                aria-label="Retry message"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    width="14"
                                                                    height="14"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    className="mr-1.5"
                                                                >
                                                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                                                    <path d="M21 3v5h-5" />
                                                                </svg>
                                                                Retry
                                                            </Button>
                                                        </FloatingTooltip>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Improved typing indicator with heart-themed colors */}
                                    {isLoading && !isStreaming && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <TypingIndicator />
                                        </motion.div>
                                    )}

                                    {/* Auto-scroll anchor */}
                                    <div ref={messageEndRef} />
                                </div>
                            )}
                        </div>
                    </FloatingCardStack>
                </div>
            </main>

            {/* Fixed prompt area at the bottom - keeping z-index higher than header */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm pb-4 pt-2 border-t border-[var(--heart-blue-500)]/10 z-20">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Enhanced message input with subtle animations and improved layout */}
                    <motion.form
                        onSubmit={handleSubmit}
                        className="relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="relative flex flex-col bg-background rounded-xl border-2 border-[var(--heart-blue-500)]/20 focus-within:border-[var(--heart-blue-500)]/40 dark:border-[var(--heart-blue-700)]/50 dark:focus-within:border-[var(--heart-cyan-500)]/50 shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all duration-300">
                            {/* Subtle gradient top border accent */}
                            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-[var(--heart-blue-500)]/60 to-[var(--heart-cyan-500)]/60"></div>

                            {/* Canvas for vanishing text effect - positioned precisely to match textarea content */}
                            <canvas
                                className={`absolute pointer-events-none z-20 left-12 top-[13px] origin-top-left ${isVanishing ? 'opacity-100' : 'opacity-0'
                                    } transition-opacity duration-150 filter invert dark:invert-0`}
                                ref={canvasRef}
                            />

                            {/* Input row with file upload icon on left */}
                            <div className="flex items-center">
                                {/* File upload icon button with tooltip */}
                                <FloatingTooltip content="Attach a file" position="top">
                                    <button
                                        type="button"
                                        className="flex items-center justify-center p-3 text-[var(--heart-blue-500)] dark:text-[var(--heart-blue-500)]/80 hover:text-[var(--heart-blue-700)] dark:hover:text-[var(--heart-blue-500)] transition-colors"
                                        aria-label="Attach a file"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-transform hover:rotate-12"
                                        >
                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                        </svg>
                                    </button>
                                </FloatingTooltip>

                                {/* Improved textarea container with vanishing effect */}
                                <div className="w-full relative">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your message..."
                                        className={`w-full py-3.5 pr-3 bg-transparent resize-none outline-none focus:outline-none min-h-[48px] max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--heart-blue-500)]/20 scrollbar-track-transparent text-sm md:text-base transition-colors duration-75 ${isVanishing ? 'text-transparent dark:text-transparent' : ''
                                            }`}
                                        disabled={isLoading || isVanishing}
                                        rows={1}
                                        aria-label="Chat message"
                                    />
                                </div>
                            </div>

                            {/* Submit button row with improved styling */}
                            <div className="flex justify-end p-2 pt-0">
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
                                                    onClick={handleCancel}
                                                    className="rounded-lg h-10 px-3 mr-2 transition-all border border-[var(--heart-blue-500)]/30 hover:bg-[var(--heart-blue-500)]/10"
                                                    aria-label="Cancel response"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="mr-1.5"
                                                    >
                                                        <path d="M18 6 6 18" />
                                                        <path d="m6 6 12 12" />
                                                    </svg>
                                                    Cancel
                                                </Button>
                                            </FloatingTooltip>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Enhanced send button with animated gradient */}
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
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth="2">
                                                <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z" fill="currentColor" />
                                            </svg>
                                        </span>
                                    )}
                                </Button>
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
        </div>
    );
}