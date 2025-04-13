"use client";

import { useEffect, useState, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { isTouchDevice } from "@/lib/utils";

/**
 * Interface for Cursor component props
 */
interface CursorProps {
    /** Enables follow cursor effect with a trailing motion */
    follow?: boolean;
    /** Size of the cursor in pixels (default: 32) */
    size?: number;
    /** Thickness of the cursor (default: 3) */
    thickness?: number;
    /** Color of the cursor (default: var(--heart-blue-500)) */
    color?: string;
    /** Current tooltip content to display, if any */
    tooltipContent?: React.ReactNode;
    /** Background color for tooltip (default: var(--background)) */
    tooltipBgColor?: string;
    /** Text color for tooltip (default: var(--foreground)) */
    tooltipTextColor?: string;
    /** Whether to disable the custom cursor entirely */
    disabled?: boolean;
}

/**
 * Custom cursor component with heart-themed styling and animations
 * Optimized for performance with direct DOM manipulation
 * 
 * @param props - Cursor configuration props
 */
export const Cursor = memo(function Cursor({
    follow = false,
    size = 32,
    thickness = 3,
    color = "var(--heart-blue-500)",
    tooltipContent = null,
    tooltipBgColor = "var(--background)",
    tooltipTextColor = "var(--foreground)",
    disabled = false
}: CursorProps) {
    // Refs for direct DOM manipulation (better performance than state)
    const cursorRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const textCursorRef = useRef<HTMLDivElement>(null);

    // Minimal state to avoid re-renders
    const [visible, setVisible] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [textHeight, setTextHeight] = useState(20); // Default text height in px
    const [tapAnimations, setTapAnimations] = useState<Array<{ id: number, x: number, y: number }>>([]);

    // Using refs for tracking values without triggering re-renders
    const nextTapId = useRef(0);
    const cursorState = useRef({
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        scale: 1,
        targetScale: 1,
        isHovering: false,
        isHoveringText: false,
        isClicking: false,
    });

    // Check if we should render the cursor
    useEffect(() => {
        // Only do detection once
        setIsTouch(isTouchDevice());

        // Apply cursor hiding styles to root
        if (!disabled && typeof window !== 'undefined') {
            const style = document.createElement('style');
            style.innerHTML = `
              .hide-cursor, 
              .hide-cursor * {
                cursor: none !important;
              }
              
              /* Optimization for transform animations */
              .hardware-accelerated {
                will-change: transform;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                transform-style: preserve-3d;
              }
              
              /* Text cursor blink animation */
              @keyframes textCursorBlink {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
              }
            `;
            document.head.appendChild(style);
            document.documentElement.classList.add('hide-cursor');

            return () => {
                document.head.removeChild(style);
                document.documentElement.classList.remove('hide-cursor');
            };
        }
    }, [disabled]);

    // Handle cursor animation with requestAnimationFrame for smoother performance
    useEffect(() => {
        if (disabled || isTouch || typeof window === 'undefined') return;

        let rafId: number | null = null;
        let isFirstMove = true;

        // Animation function using requestAnimationFrame for smoother updates
        const animateCursor = () => {
            const state = cursorState.current;

            // Smoothly interpolate position based on follow setting
            // Higher smoothing value = less lag but more latency
            const smoothing = follow ? 0.15 : 0.25;

            // Calculate new position with smoothing
            state.x += (state.targetX - state.x) * smoothing;
            state.y += (state.targetY - state.y) * smoothing;

            // Update scale with smooth transition
            state.scale += (state.targetScale - state.scale) * 0.2;

            // Apply transforms directly to DOM for optimal performance
            if (cursorRef.current) {
                cursorRef.current.style.transform =
                    `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%) scale(${state.scale})`;
            }

            // Update tooltip position if visible
            if (tooltipRef.current && tooltipContent) {
                tooltipRef.current.style.transform =
                    `translate3d(${state.x + size / 1.5}px, ${state.y}px, 0) translate(0, -50%)`;
            }

            // Update text cursor position and opacity if visible
            if (textCursorRef.current) {
                textCursorRef.current.style.transform =
                    `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%)`;
                textCursorRef.current.style.opacity = state.isHoveringText ? '1' : '0';
            }

            // Continue animation loop
            rafId = requestAnimationFrame(animateCursor);
        };

        // Start animation loop
        rafId = requestAnimationFrame(animateCursor);

        // Handle mouse movement with direct state updates
        const handleMouseMove = (e: MouseEvent) => {
            const x = e.clientX;
            const y = e.clientY;

            // Update target position
            cursorState.current.targetX = x;
            cursorState.current.targetY = y;

            // Show cursor on first movement
            if (isFirstMove) {
                setVisible(true);
                cursorState.current.x = x; // No initial animation
                cursorState.current.y = y;
                isFirstMove = false;
            }

            // Detect element types for different cursor behaviors
            const target = e.target as HTMLElement;

            // Check if hovering interactive elements
            const isInteractive =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                !!target.closest('a') ||
                !!target.closest('button') ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('hoverable') ||
                !!target.closest('.hoverable');

            // Check if hovering text elements
            const isTextElement =
                target.tagName === 'P' ||
                target.tagName === 'SPAN' ||
                target.tagName === 'H1' ||
                target.tagName === 'H2' ||
                target.tagName === 'H3' ||
                target.tagName === 'H4' ||
                target.tagName === 'H5' ||
                target.tagName === 'H6' ||
                target.tagName === 'LI' ||
                target.tagName === 'LABEL' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.classList.contains('text-content') ||
                !!target.closest('.text-content') ||
                target.getAttribute('data-cursor-text') === 'true' ||
                !!target.closest('[data-cursor-text="true"]');

            // Update cursor state
            cursorState.current.isHovering = isInteractive;
            cursorState.current.isHoveringText = isTextElement && !isInteractive;

            // If hovering text, adjust the text cursor height based on the element's font size
            if (isTextElement) {
                const styles = window.getComputedStyle(target);
                const fontSize = parseFloat(styles.fontSize);
                // Set text cursor height based on font size with a minimum
                setTextHeight(Math.max(fontSize * 1.2, 16));
            }

            // Apply scale based on hover state
            if (cursorState.current.isClicking && !cursorState.current.isHoveringText) {
                cursorState.current.targetScale = 0.8;
            } else if (cursorState.current.isHovering) {
                cursorState.current.targetScale = 1.2;
            } else if (cursorState.current.isHoveringText) {
                cursorState.current.targetScale = 0;
            } else {
                cursorState.current.targetScale = 1;
            }
        };

        // Handle mouse down with tap animation
        const handleMouseDown = (e: MouseEvent) => {
            cursorState.current.isClicking = true;
            cursorState.current.targetScale = 0.8;

            // Only create tap animation if not hovering text
            if (!cursorState.current.isHoveringText) {
                const tapId = nextTapId.current++;
                setTapAnimations(prev => [...prev, { id: tapId, x: e.clientX, y: e.clientY }]);

                // Auto-remove tap animation after it completes
                setTimeout(() => {
                    setTapAnimations(prev => prev.filter(tap => tap.id !== tapId));
                }, 700);
            }
        };

        const handleMouseUp = () => {
            cursorState.current.isClicking = false;

            // Reset scale based on current state
            if (cursorState.current.isHoveringText) {
                cursorState.current.targetScale = 0;
            } else if (cursorState.current.isHovering) {
                cursorState.current.targetScale = 1.2;
            } else {
                cursorState.current.targetScale = 1;
            }
        };

        // Handle visibility when mouse leaves/enters window
        const handleMouseLeave = () => {
            setVisible(false);
        };

        const handleMouseEnter = () => {
            if (!isFirstMove) {
                setVisible(true);
            }
        };

        // Add all event listeners with passive flag for performance
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mousedown', handleMouseDown, { passive: true });
        document.addEventListener('mouseup', handleMouseUp, { passive: true });
        document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
        document.addEventListener('mouseenter', handleMouseEnter, { passive: true });

        return () => {
            // Clean up all event listeners and cancel animation frame
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [disabled, isTouch, follow, size, tooltipContent]);

    // Don't render if disabled, server-side, or on touch device
    if (disabled || typeof window === 'undefined' || isTouch) {
        return null;
    }

    return (
        <>
            {/* Main circular cursor - using plain div with CSS transforms for best performance */}
            <div
                ref={cursorRef}
                className="fixed pointer-events-none z-[99999] transform-gpu hardware-accelerated"
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    top: 0,
                    left: 0,
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.15s ease",
                    transform: "translate3d(0px, 0px, 0) translate(-50%, -50%) scale(1)"
                }}
            >
                {/* Outer ring for thicker appearance */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        border: `${thickness}px solid ${color}`,
                        opacity: 0.3,
                    }}
                />
                {/* Inner circle for solid appearance */}
                <div
                    className="absolute rounded-full"
                    style={{
                        inset: `${thickness * 2}px`,
                        backgroundColor: color,
                        opacity: 0.7,
                    }}
                />
            </div>

            {/* Tap animations with Framer Motion */}
            <AnimatePresence>
                {tapAnimations.map(tap => (
                    <motion.div
                        key={tap.id}
                        className="fixed pointer-events-none z-[99998]"
                        style={{
                            position: 'fixed',
                            width: size * 1.5,
                            height: size * 1.5,
                            borderRadius: '50%',
                            backgroundColor: color,
                            x: tap.x,
                            y: tap.y,
                            translateX: "-50%",
                            translateY: "-50%"
                        }}
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{
                            scale: [0.8, 1.5, 0.6],
                            opacity: [0.8, 0.6, 0]
                        }}
                        transition={{
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1],
                            times: [0, 0.5, 1]
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Tooltip that follows cursor */}
            {tooltipContent && (
                <div
                    ref={tooltipRef}
                    className="fixed pointer-events-none z-[99999] hardware-accelerated"
                    style={{
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.15s ease",
                        transform: "translate3d(0px, 0px, 0) translate(0, -50%)"
                    }}
                >
                    <div
                        className="whitespace-nowrap rounded-md px-2.5 py-1.5 shadow-lg"
                        style={{
                            backgroundColor: tooltipBgColor,
                            color: tooltipTextColor,
                            borderColor: color,
                            borderWidth: "1px",
                            minWidth: "max-content",
                            maxWidth: "280px"
                        }}
                    >
                        {tooltipContent}
                    </div>
                </div>
            )}

            {/* Text cursor for text elements */}
            <div
                ref={textCursorRef}
                className="text-cursor fixed pointer-events-none z-[99998] hardware-accelerated"
                style={{
                    opacity: 0,
                    transform: "translate3d(0px, 0px, 0) translate(-50%, -50%)"
                }}
            >
                <div
                    className="text-cursor-line hardware-accelerated"
                    style={{
                        height: `${textHeight}px`,
                        width: `${thickness}px`,
                        backgroundColor: color,
                        animation: "textCursorBlink 1s ease-in-out infinite"
                    }}
                />
            </div>
        </>
    );
});

export default Cursor;