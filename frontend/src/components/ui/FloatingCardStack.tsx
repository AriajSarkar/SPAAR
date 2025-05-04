'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface FloatingCardStackProps {
    /**
     * Children elements to render in the card stack
     */
    children: React.ReactNode;
    /**
     * Optional CSS class to apply to the container
     */
    className?: string;
    /**
     * Direction of stacking effect (vertical or horizontal)
     * Note: Currently not used but kept for future implementation
     */
    stackDirection?: 'vertical' | 'horizontal';
    /**
     * Background pattern style
     */
    patternStyle?: 'dots' | 'lines' | 'grid' | 'none';
    /**
     * Whether to apply blur glass effect
     * Note: Currently not used but kept for future implementation
     */
    glassEffect?: boolean;
    /**
     * Delay between animations in ms
     * Note: Currently not used but kept for future implementation
     */
    staggerDelay?: number;
}

/**
 * FloatingCardStack component creates a clean container for chat messages
 * Styled after popular AI chatbots like ChatGPT, Claude, and DeepSeek
 */
export const FloatingCardStack: React.FC<FloatingCardStackProps> = ({
    children,
    className,
    patternStyle = 'none', // Default to no pattern for cleaner look
    // The following props are preserved for future use but not currently implemented
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stackDirection = 'vertical',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    glassEffect = false, // Default to no glass effect for cleaner look
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    staggerDelay = 50,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn('w-full h-full', className)}></div>;
    }

    return (
        <div className={cn('relative w-full h-full bg-background', className)}>
            {/* Subtle background pattern only if explicitly requested */}
            {patternStyle !== 'none' && (
                <div
                    className="absolute inset-0 opacity-[0.02] pointer-events-none z-0"
                    style={{
                        backgroundImage:
                            patternStyle === 'dots'
                                ? 'radial-gradient(circle, currentColor 1px, transparent 1px)'
                                : patternStyle === 'lines'
                                  ? 'linear-gradient(to right, currentColor 1px, transparent 1px)'
                                  : 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
            )}

            {/* Main content container - simplified for cleaner look */}
            <div className="relative z-10 w-full h-full overflow-y-auto">
                <AnimatePresence mode="sync">
                    {React.Children.map(children, (child, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                delay: index * 0.03,
                                duration: 0.3,
                            }}
                            className="w-full"
                        >
                            {child}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
