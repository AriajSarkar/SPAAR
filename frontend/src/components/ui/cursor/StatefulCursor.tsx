"use client";

import { memo, useEffect, useState } from "react";
import { useCursorState } from "./useCursorState";
import { Cursor } from "./Cursor";

/**
 * Props for the StatefulCursor component
 */
export interface StatefulCursorProps {
    /** Enables follow cursor effect with a trailing motion */
    follow?: boolean;
    /** Size of the cursor in pixels (default: 32) */
    size?: number;
    /** Color of the cursor (default: var(--heart-cyan-500)) */
    color?: string;
    /** Background color for tooltip (default: var(--background)) */
    tooltipBgColor?: string;
    /** Text color for tooltip (default: var(--foreground)) */
    tooltipTextColor?: string;
    /** Whether to disable the custom cursor entirely */
    disabled?: boolean;
}

/**
 * Cursor component that automatically responds to global cursor state
 * Performance optimized with direct DOM manipulation and translate3d
 * Follows the heart-themed design system
 * 
 * @param props - Cursor configuration props
 */
export const StatefulCursor = memo(function StatefulCursor({
    follow = false,
    size = 32,
    color = "var(--heart-cyan-500)",
    tooltipBgColor = "var(--background)",
    tooltipTextColor = "var(--foreground)",
    disabled = false
}: StatefulCursorProps) {
    // Get cursor state from context
    const { state } = useCursorState();
    
    // Use memoized tooltip content to prevent unnecessary re-renders
    const [tooltipContent, setTooltipContent] = useState<React.ReactNode | null>(null);
    
    // Only update tooltip content when content changes to prevent re-renders
    useEffect(() => {
        if (state.content !== tooltipContent) {
            setTooltipContent(state.content);
        }
    }, [state.content, tooltipContent]);
    
    return (
        <Cursor
            follow={follow}
            size={size}
            color={color}
            tooltipContent={tooltipContent}
            tooltipBgColor={tooltipBgColor}
            tooltipTextColor={tooltipTextColor}
            disabled={disabled}
        />
    );
});