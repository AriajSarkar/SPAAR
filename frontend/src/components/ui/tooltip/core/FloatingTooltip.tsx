'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from 'motion/react';
import { cn } from '@/lib/utils';
import { FloatingTooltipProps } from '../types';
import { getAnimationVariants, springConfigs, getArrowStyles, calculateTooltipPosition } from '../utils';

/**
 * FloatingTooltip component for displaying tooltips on hover
 * Can behave like a floating cursor with smooth animations
 */
export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
    content,
    position = 'top',
    children,
    className,
    showArrow = true,
    delayShow = 100,
    delayHide = 100,
    offset = 8,
    backgroundColor,
    textColor,
    borderColor,
    cursorMode = false,
    cursorAnimation = 'spring',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPositioned, setIsPositioned] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [originCoords, setOriginCoords] = useState({ x: 0, y: 0 });
    const [initialPosition, setInitialPosition] = useState<DOMRect | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const showTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const mousePositionRef = useRef({ x: 0, y: 0 });

    // Motion values for cursor-like behavior
    const mouseX = useMotionValue<number>(0);
    const mouseY = useMotionValue<number>(0);

    // Apply spring physics for smooth movement
    const springX = useSpring(mouseX, springConfigs[cursorAnimation]);
    const springY = useSpring(mouseY, springConfigs[cursorAnimation]);

    // Transform the tooltip position with offset from cursor
    const tooltipX = useTransform(springX, (x) => x + (cursorMode ? 20 : 0));
    const tooltipY = useTransform(springY, (y) => y + (cursorMode ? -10 : 0));

    // Store the initial position of the trigger element on mount
    useEffect(() => {
        if (triggerRef.current && !initialPosition) {
            const rect = triggerRef.current.getBoundingClientRect();
            setInitialPosition(rect);

            // Pre-calculate origin coordinates for animations
            const originX = rect.left + rect.width / 2;
            const originY = rect.top + rect.height / 2;
            setOriginCoords({ x: originX, y: originY });

            // Set initial coords based on element position and desired tooltip position
            const { x, y } = calculateInitialPosition(rect, position, offset);
            setCoords({ x, y });

            if (cursorMode) {
                // Initialize spring values from the element
                mouseX.set(originX);
                mouseY.set(originY);
            }
        }
    }, [cursorMode, mouseX, mouseY, offset, position, initialPosition]);

    // Calculate initial position based on element and position
    const calculateInitialPosition = (rect: DOMRect, position: string, offset: number) => {
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        let x = originX;
        let y = originY;

        // Approximate position based on specified position
        switch (position) {
            case 'top':
                y = rect.top - offset;
                break;
            case 'top-right':
                x = rect.right;
                y = rect.top - offset;
                break;
            case 'top-left':
                x = rect.left;
                y = rect.top - offset;
                break;
            case 'right':
                x = rect.right + offset;
                break;
            case 'bottom':
                y = rect.bottom + offset;
                break;
            case 'left':
                x = rect.left - offset;
                break;
        }

        return { x, y };
    };

    // Handle mouse movement for cursor-like behavior
    useEffect(() => {
        if (!cursorMode) return;

        const updateMousePosition = (e: MouseEvent) => {
            mousePositionRef.current = { x: e.clientX, y: e.clientY };

            if (isVisible) {
                // Update motion values with current mouse position
                mouseX.set(e.clientX);
                mouseY.set(e.clientY);
            }
        };

        window.addEventListener('mousemove', updateMousePosition, { passive: true });
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, [cursorMode, isVisible, mouseX, mouseY]);

    // Calculate tooltip position based on target element
    const updatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        // Store origin coordinates (center of the trigger element)
        const originX = triggerRect.left + triggerRect.width / 2;
        const originY = triggerRect.top + triggerRect.height / 2;
        setOriginCoords({ x: originX, y: originY });

        // Calculate tooltip position
        const { x, y } = calculateTooltipPosition(triggerRect, tooltipRect, position, offset);

        setCoords({ x, y });
        setIsPositioned(true);

        if (cursorMode) {
            // In cursor mode, initialize from the trigger element
            springX.set(originX);
            springY.set(originY);

            // After a small delay, begin following the mouse if in cursor mode
            if (mousePositionRef.current.x && mousePositionRef.current.y) {
                setTimeout(() => {
                    mouseX.set(mousePositionRef.current.x);
                    mouseY.set(mousePositionRef.current.y);
                }, 50);
            }
        }
    }, [cursorMode, mouseX, mouseY, offset, position, springX, springY]);

    // Handle hover events with debounce
    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = undefined;
        }

        // Store initial mouse position for animation origin
        if (cursorMode) {
            mousePositionRef.current = { x: e.clientX, y: e.clientY };
        }

        // Get element position on hover to ensure tooltip appears from the element
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const originX = rect.left + rect.width / 2;
            const originY = rect.top + rect.height / 2;
            setOriginCoords({ x: originX, y: originY });

            // For cursor mode, set initial position to element center
            if (cursorMode) {
                mouseX.set(originX);
                mouseY.set(originY);
            }
        }

        showTimeoutRef.current = setTimeout(() => {
            // Set the tooltip to visible
            setIsVisible(true);

            // Update position to set correct coordinates
            requestAnimationFrame(() => {
                updatePosition();
            });
        }, delayShow);
    };

    const handleMouseLeave = () => {
        if (showTimeoutRef.current) {
            clearTimeout(showTimeoutRef.current);
            showTimeoutRef.current = undefined;
        }

        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            // Reset positioned state when hiding
            setIsPositioned(false);
        }, delayHide);
    };

    // Create separate focus handlers with correct types
    const handleFocus = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = undefined;
        }

        showTimeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            requestAnimationFrame(() => {
                updatePosition();
            });
        }, delayShow);
    };

    const handleBlur = () => {
        if (showTimeoutRef.current) {
            clearTimeout(showTimeoutRef.current);
            showTimeoutRef.current = undefined;
        }

        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            setIsPositioned(false);
        }, delayHide);
    };

    // Update position on window resize
    useEffect(() => {
        if (isVisible) {
            const handleResize = () => {
                updatePosition();
            };

            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleResize, true);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleResize, true);
            };
        }
    }, [isVisible, updatePosition]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    // Get tooltip style based on mode (cursor or fixed position)
    const getTooltipStyle = () => {
        if (cursorMode) {
            return {
                left: 0,
                top: 0,
                x: tooltipX,
                y: tooltipY,
                backgroundColor: backgroundColor || 'var(--background)',
                color: textColor || 'var(--foreground)',
                border: `1px solid ${borderColor || 'var(--heart-cyan-500)'}`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                willChange: 'transform, opacity' as const,
                visibility: isPositioned ? ('visible' as const) : ('hidden' as const),
            } as const;
        }

        return {
            backgroundColor: backgroundColor || 'var(--background)',
            color: textColor || 'var(--foreground)',
            border: `1px solid ${borderColor || 'var(--heart-cyan-500)'}`,
            left: coords.x,
            top: coords.y,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            willChange: 'transform, opacity' as const,
            visibility: isPositioned ? ('visible' as const) : ('hidden' as const),
        } as const;
    };

    return (
        <>
            <div
                ref={triggerRef}
                className="inline-block"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
            >
                {children}
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        ref={tooltipRef}
                        className={cn(
                            'fixed z-[9999] max-w-[280px] whitespace-normal break-words rounded-md px-3 py-1.5',
                            'text-sm shadow-lg pointer-events-none hardware-accelerated',
                            cursorMode && 'tooltip-cursor',
                            className,
                        )}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={getAnimationVariants(cursorMode, originCoords, coords)}
                        style={getTooltipStyle()}
                        onAnimationComplete={() => {
                            if (!isPositioned) {
                                updatePosition();
                            }
                        }}
                    >
                        {content}
                        {showArrow && !cursorMode && (
                            <div style={getArrowStyles(position, 6, borderColor, backgroundColor)} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
