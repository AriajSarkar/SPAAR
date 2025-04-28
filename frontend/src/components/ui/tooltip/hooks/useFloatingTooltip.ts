'use client';

import { useState, useCallback } from 'react';
import { UseFloatingTooltipProps } from '../types';

/**
 * Hook to handle floating tooltip functionality
 * @param props - The tooltip configuration props
 * @returns Object with tooltip props and helpers
 */
export function useFloatingTooltip(props: UseFloatingTooltipProps = {}) {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            setIsHovered(true);
            // Add classes for cursor integration if needed
            if (props.integrateCursor) {
                e.currentTarget.classList.add('tooltip-hover');
            }
            // Add cursor mode classes
            if (props.cursorMode) {
                e.currentTarget.classList.add('cursor-tooltip-trigger');
            }
        },
        [props.integrateCursor, props.cursorMode],
    );

    const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            setIsHovered(false);
            // Remove classes for cursor integration if needed
            if (props.integrateCursor) {
                e.currentTarget.classList.remove('tooltip-hover');
            }
            // Remove cursor mode classes
            if (props.cursorMode) {
                e.currentTarget.classList.remove('cursor-tooltip-trigger');
            }
        },
        [props.integrateCursor, props.cursorMode],
    );

    return {
        isHovered,
        tooltipProps: {
            content: props.content || '', // Provide empty string as fallback
            position: props.position || 'top',
            className: props.className,
            showArrow: props.showArrow ?? true,
            delayShow: props.delayShow ?? 100,
            delayHide: props.delayHide ?? 100,
            offset: props.offset ?? 8,
            backgroundColor: props.backgroundColor,
            textColor: props.textColor,
            borderColor: props.borderColor,
            cursorMode: props.cursorMode ?? false,
            cursorAnimation: props.cursorAnimation || 'spring',
        },
        triggerProps: {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            className: props.cursorMode ? 'tooltip-trigger cursor-tooltip-trigger' : 'tooltip-trigger',
        },
    };
}
