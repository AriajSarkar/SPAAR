"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Props for FloatingTooltip component
 */
export interface FloatingTooltipProps {
    /** Content to display in the tooltip */
    content: React.ReactNode;
    /** Position of tooltip relative to target element */
    position?: "top" | "right" | "bottom" | "left" | "top-right" | "top-left";
    /** Children to wrap with tooltip functionality */
    children: React.ReactNode;
    /** Optional CSS class name */
    className?: string;
    /** Whether to show an arrow pointing to the target */
    showArrow?: boolean;
    /** Delay before showing tooltip in ms (default: 100) */
    delayShow?: number;
    /** Delay before hiding tooltip in ms (default: 100) */
    delayHide?: number;
    /** Custom offset from target element in pixels */
    offset?: number;
    /** Background color override */
    backgroundColor?: string;
    /** Text color override */
    textColor?: string;
    /** Border color override */
    borderColor?: string;
    /** Enable tooltip cursor-like behavior */
    cursorMode?: boolean;
    /** Animation style for the tooltip cursor */
    cursorAnimation?: "spring" | "smooth" | "delayed" | "elastic";
}

/**
 * FloatingTooltip component for displaying tooltips on hover
 * Can behave like a floating cursor with smooth animations
 * Features heart-themed styling and multiple animation options
 */
export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
    content,
    position = "top",
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
    cursorAnimation = "spring"
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

    // Configure spring behavior based on animation style
    const springConfig = {
        spring: { damping: 25, stiffness: 300 },
        smooth: { damping: 50, stiffness: 100 },
        delayed: { damping: 30, stiffness: 200 },
        elastic: { damping: 10, stiffness: 400 }
    };

    // Apply spring physics for smooth movement
    const springX = useSpring(mouseX, springConfig[cursorAnimation]);
    const springY = useSpring(mouseY, springConfig[cursorAnimation]);

    // Transform the tooltip position with offset from cursor
    const tooltipX = useTransform(springX, x => x + (cursorMode ? 20 : 0));
    const tooltipY = useTransform(springY, y => y + (cursorMode ? -10 : 0));

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
            let x = originX;
            let y = originY;

            // Approximate position based on specified position
            switch (position) {
                case "top":
                    y = rect.top - offset;
                    break;
                case "top-right":
                    x = rect.right;
                    y = rect.top - offset;
                    break;
                case "top-left":
                    x = rect.left;
                    y = rect.top - offset;
                    break;
                case "right":
                    x = rect.right + offset;
                    break;
                case "bottom":
                    y = rect.bottom + offset;
                    break;
                case "left":
                    x = rect.left - offset;
                    break;
            }

            setCoords({ x, y });

            if (cursorMode) {
                // Initialize spring values from the element
                mouseX.set(originX);
                mouseY.set(originY);
            }
        }
    }, [cursorMode, mouseX, mouseY, offset, position, initialPosition]);

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
        // This will be used as the starting point for the tooltip animation
        const originX = triggerRect.left + triggerRect.width / 2;
        const originY = triggerRect.top + triggerRect.height / 2;
        setOriginCoords({ x: originX, y: originY });

        let x = 0;
        let y = 0;

        // Calculate final tooltip position based on desired position
        switch (position) {
            case "top":
                x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                y = triggerRect.top - tooltipRect.height - offset;
                break;
            case "top-right":
                x = triggerRect.right - tooltipRect.width;
                y = triggerRect.top - tooltipRect.height - offset;
                break;
            case "top-left":
                x = triggerRect.left;
                y = triggerRect.top - tooltipRect.height - offset;
                break;
            case "right":
                x = triggerRect.right + offset;
                y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                break;
            case "bottom":
                x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                y = triggerRect.bottom + offset;
                break;
            case "left":
                x = triggerRect.left - tooltipRect.width - offset;
                y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                break;
            default:
                x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                y = triggerRect.top - tooltipRect.height - offset;
        }

        // Keep tooltip within viewport
        x = Math.max(10, Math.min(x, window.innerWidth - tooltipRect.width - 10));
        y = Math.max(10, Math.min(y, window.innerHeight - tooltipRect.height - 10));

        setCoords({ x, y });
        setIsPositioned(true);

        if (cursorMode) {
            // In cursor mode, initialize from the trigger element
            // Start from the trigger element center, then animate to cursor position
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
            // Delay by one frame to ensure the tooltip is rendered
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

            window.addEventListener("resize", handleResize);
            window.addEventListener("scroll", handleResize, true);

            return () => {
                window.removeEventListener("resize", handleResize);
                window.removeEventListener("scroll", handleResize, true);
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

    // Get animation variants based on position and origin
    const getAnimationVariants = () => {
        // Always animate from origin coordinates (the trigger element)
        return {
            hidden: {
                opacity: 0,
                scale: 0.8,
                x: cursorMode ? undefined : (originCoords.x - coords.x),
                y: cursorMode ? undefined : (originCoords.y - coords.y)
            },
            visible: {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                transition: {
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                }
            },
            exit: {
                opacity: 0,
                scale: 0.8,
                x: cursorMode ? undefined : (originCoords.x - coords.x) / 2,
                y: cursorMode ? undefined : (originCoords.y - coords.y) / 2,
                transition: {
                    duration: 0.15,
                }
            }
        };
    };

    // Get arrow styles based on position
    const getArrowStyles = () => {
        const arrowSize = 6;
        const styles = {
            position: "absolute" as const,
            width: 0,
            height: 0,
            borderLeft: `${arrowSize}px solid transparent`,
            borderRight: `${arrowSize}px solid transparent`,
            borderTop: `${arrowSize}px solid ${borderColor || backgroundColor || "var(--background)"}`,
            borderBottom: 0,
            filter: "drop-shadow(0 -1px 0px var(--color-border))",
        };

        if (position.includes("top")) {
            return {
                ...styles,
                bottom: -arrowSize,
                left: "50%",
                transform: "translateX(-50%)",
            };
        } else if (position === "bottom") {
            return {
                ...styles,
                top: -arrowSize,
                left: "50%",
                transform: "translateX(-50%) rotate(180deg)",
            };
        } else if (position === "left") {
            return {
                ...styles,
                right: -arrowSize,
                top: "50%",
                transform: "translateY(-50%) rotate(90deg)",
            };
        } else if (position === "right") {
            return {
                ...styles,
                left: -arrowSize,
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
            };
        }

        return styles;
    };

    // Get tooltip style based on mode (cursor or fixed position)
    const getTooltipStyle = () => {
        if (cursorMode) {
            return {
                left: 0,
                top: 0,
                x: tooltipX,
                y: tooltipY,
                backgroundColor: backgroundColor || "var(--background)",
                color: textColor || "var(--foreground)",
                border: `1px solid ${borderColor || "var(--heart-cyan-500)"}`,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                willChange: "transform, opacity" as const,
                visibility: isPositioned ? "visible" as const : "hidden" as const,
            } as const;
        }

        return {
            backgroundColor: backgroundColor || "var(--background)",
            color: textColor || "var(--foreground)",
            border: `1px solid ${borderColor || "var(--heart-cyan-500)"}`,
            left: coords.x,
            top: coords.y,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            willChange: "transform, opacity" as const,
            visibility: isPositioned ? "visible" as const : "hidden" as const,
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
                            "fixed z-[9999] max-w-[280px] whitespace-normal break-words rounded-md px-3 py-1.5",
                            "text-sm shadow-lg pointer-events-none hardware-accelerated",
                            cursorMode && "tooltip-cursor",
                            className
                        )}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={getAnimationVariants()}
                        style={getTooltipStyle()}
                        onAnimationComplete={() => {
                            if (!isPositioned) {
                                updatePosition();
                            }
                        }}
                    >
                        {content}
                        {showArrow && !cursorMode && <div style={getArrowStyles()} />}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingTooltip;