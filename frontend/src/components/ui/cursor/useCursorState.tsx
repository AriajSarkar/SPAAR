'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Interface for element rect tracking
 */
interface ElementRect {
    rect: DOMRect;
    position?: 'top' | 'top-right' | 'right' | 'bottom' | 'left';
}

/**
 * Interface for cursor state
 */
interface CursorState {
    cursorX: number;
    cursorY: number;
    isHovering: boolean;
    content: React.ReactNode | null;
    hoveredElementRect: ElementRect | null;
}

/**
 * Interface for cursor context value
 */
interface CursorContextValue {
    state: CursorState;
    setHovering: (isHovering: boolean) => void;
    setContent: (content: React.ReactNode | null) => void;
    setHoveredElementRect: (elementRect: ElementRect | null) => void;
}

// Default cursor state
// const defaultState: CursorState = {
//     cursorX: 0,
//     cursorY: 0,
//     isHovering: false,
//     content: null,
//     hoveredElementRect: null,
// };

// Create context with default value
const CursorContext = createContext<CursorContextValue | undefined>(undefined);

/**
 * Provider component for global cursor state management
 * Performance-optimized with minimal re-renders
 *
 * @param props - Component props
 */
export function CursorProvider({ children }: { children: React.ReactNode }) {
    // Use state for values that trigger re-renders
    const [content, setContent] = useState<React.ReactNode | null>(null);

    // Use ref for values that shouldn't trigger re-renders
    const stateRef = useRef({
        cursorX: 0,
        cursorY: 0,
        isHovering: false,
        hoveredElementRect: null as ElementRect | null,
    });

    // Mouse move handler updates cursor position
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            stateRef.current.cursorX = e.clientX;
            stateRef.current.cursorY = e.clientY;
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Callback functions to update state
    const setHovering = useCallback((isHovering: boolean) => {
        stateRef.current.isHovering = isHovering;
    }, []);

    const setContentCallback = useCallback((newContent: React.ReactNode | null) => {
        setContent(newContent);
    }, []);

    const setHoveredElementRect = useCallback((elementRect: ElementRect | null) => {
        stateRef.current.hoveredElementRect = elementRect;
    }, []);

    // Create a memoized context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            state: {
                get cursorX() {
                    return stateRef.current.cursorX;
                },
                get cursorY() {
                    return stateRef.current.cursorY;
                },
                get isHovering() {
                    return stateRef.current.isHovering;
                },
                get hoveredElementRect() {
                    return stateRef.current.hoveredElementRect;
                },
                content,
            },
            setHovering,
            setContent: setContentCallback,
            setHoveredElementRect,
        }),
        [content, setHovering, setContentCallback, setHoveredElementRect],
    );

    return <CursorContext.Provider value={contextValue}>{children}</CursorContext.Provider>;
}

/**
 * Custom hook to access cursor context
 * @returns CursorContextValue - the cursor context value
 */
export function useCursorState(): CursorContextValue {
    const context = useContext(CursorContext);

    if (context === undefined) {
        throw new Error('useCursorState must be used within a CursorProvider');
    }

    return context;
}
