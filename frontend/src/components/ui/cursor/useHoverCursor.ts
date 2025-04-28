'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useCursorState } from './useCursorState';
import type { ReactNode } from 'react';

/**
 * Props for the useHoverCursor hook
 */
interface UseHoverCursorProps {
    /** Content to display in the tooltip */
    content?: ReactNode;
    /** Whether the cursor should show the content (tooltip) */
    showContent?: boolean;
    /** Position of tooltip relative to element (default: "top") */
    position?: 'top' | 'top-right' | 'right' | 'bottom' | 'left';
    /** Whether the element is a text element */
    isText?: boolean;
    /** Whether to show click effect on the cursor */
    clickEffect?: boolean;
    /** Animation style for the tooltip (default: "spring") */
    animationStyle?: 'spring' | 'fade' | 'scale';
}

/**
 * Hook that enables hover tracking for custom cursor interactions
 * Optimized for performance with minimal re-renders
 *
 * @param props - Configuration for cursor hover behavior
 * @returns Object with event handlers and CSS class
 */
export function useHoverCursor({
    content = null,
    showContent = false,
    position = 'top',
    isText = false,
    clickEffect = false,
    animationStyle = 'spring',
}: UseHoverCursorProps = {}) {
    const { setContent, setHovering } = useCursorState();
    const elementRef = useRef<HTMLElement | null>(null);

    // Track content to prevent unnecessary updates
    const contentRef = useRef(content);

    // Update content ref when content changes
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Clean up content on unmount
    useEffect(() => {
        return () => {
            if (elementRef.current) {
                setContent(null);
                setHovering(false);
            }
        };
    }, [setContent, setHovering]);

    // Handle mouse enter
    const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            elementRef.current = e.currentTarget;

            // Show content in cursor if requested
            if (showContent && contentRef.current) {
                setContent(contentRef.current);
            }

            // Set hover state based on text/interactive state
            if (!isText) {
                setHovering(true);
            }

            // Add data attributes for cursor detection
            if (isText) {
                e.currentTarget.setAttribute('data-cursor-text', 'true');
            } else {
                e.currentTarget.classList.add('hoverable');
            }
        },
        [setContent, setHovering, showContent, isText],
    );

    // Handle mouse leave
    const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            elementRef.current = null;

            // Clear content from cursor
            if (showContent) {
                setContent(null);
            }

            // Reset hover state
            setHovering(false);

            // Remove data attributes
            if (isText) {
                e.currentTarget.removeAttribute('data-cursor-text');
            } else {
                e.currentTarget.classList.remove('hoverable');
            }
        },
        [setContent, setHovering, showContent, isText],
    );

    // Return props to spread to the target element
    return {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        className: 'cursor-aware',
        'data-cursor-animation': animationStyle,
        'data-cursor-click-effect': clickEffect ? 'true' : 'false',
        'data-cursor-position': position,
    };
}
