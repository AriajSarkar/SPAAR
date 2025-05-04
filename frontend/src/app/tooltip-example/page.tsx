'use client';

import React from 'react';
import { FloatingTooltip } from '@/components/ui/tooltip';
import { useFloatingTooltip } from '@/components/ui/tooltip';
import { StatefulCursor } from '@/components/ui/cursor';
import { useHoverCursor } from '@/components/ui/cursor';
import { FloatingNavbar } from '@/components/Navbar/FloatingNavbar';
import { cn } from '@/lib/utils';

export default function TooltipExamplePage() {
    return (
        <>
            <FloatingNavbar />
            <StatefulCursor follow={true} color="var(--heart-cyan-500)" />

            <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
                <h1 className="text-3xl font-bold">Tooltip Examples</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                    {/* Basic tooltip example */}
                    <ExampleCard title="Basic Tooltip">
                        <FloatingTooltip content="This is a basic tooltip">
                            <button className="px-4 py-2 rounded-md bg-[var(--heart-blue-500)] text-white">
                                Hover me
                            </button>
                        </FloatingTooltip>
                    </ExampleCard>

                    {/* Different positions */}
                    <ExampleCard title="Tooltip Positions">
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingTooltip content="Top tooltip" position="top">
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Top
                                </button>
                            </FloatingTooltip>

                            <FloatingTooltip content="Right tooltip" position="right">
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Right
                                </button>
                            </FloatingTooltip>

                            <FloatingTooltip content="Bottom tooltip" position="bottom">
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Bottom
                                </button>
                            </FloatingTooltip>

                            <FloatingTooltip content="Left tooltip" position="left">
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Left
                                </button>
                            </FloatingTooltip>
                        </div>
                    </ExampleCard>

                    {/* Cursor Mode Tooltip - NEW! */}
                    <ExampleCard title="Cursor Mode Tooltip">
                        <FloatingTooltip
                            content="I follow the cursor like a floating companion!"
                            cursorMode={true}
                            backgroundColor="var(--heart-cyan-500)"
                            textColor="white"
                            borderColor="var(--heart-cyan-700)"
                            showArrow={false}
                        >
                            <button className="px-4 py-2 rounded-md border border-[var(--heart-cyan-500)] text-[var(--heart-cyan-500)]">
                                Floating cursor tooltip
                            </button>
                        </FloatingTooltip>
                    </ExampleCard>

                    {/* Different animation styles - NEW! */}
                    <ExampleCard title="Animation Styles">
                        <div className="grid grid-cols-2 gap-4">
                            <FloatingTooltip
                                content="Spring animation"
                                cursorMode={true}
                                cursorAnimation="spring"
                                backgroundColor="var(--heart-blue-500)"
                                textColor="white"
                            >
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Spring
                                </button>
                            </FloatingTooltip>

                            <FloatingTooltip
                                content="Smooth follow"
                                cursorMode={true}
                                cursorAnimation="smooth"
                                backgroundColor="var(--heart-blue-500)"
                                textColor="white"
                            >
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Smooth
                                </button>
                            </FloatingTooltip>

                            <FloatingTooltip
                                content="With delay"
                                cursorMode={true}
                                cursorAnimation="delayed"
                                backgroundColor="var(--heart-blue-500)"
                                textColor="white"
                            >
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Delayed
                                </button>
                            </FloatingTooltip>

                            <FloatingTooltip
                                content="Elastic bounce"
                                cursorMode={true}
                                cursorAnimation="elastic"
                                backgroundColor="var(--heart-blue-500)"
                                textColor="white"
                            >
                                <button className="px-3 py-1.5 text-sm rounded-md bg-[var(--heart-blue-500)] text-white">
                                    Elastic
                                </button>
                            </FloatingTooltip>
                        </div>
                    </ExampleCard>

                    {/* Custom colors */}
                    <ExampleCard title="Custom Styling">
                        <FloatingTooltip
                            content="Custom styled tooltip"
                            backgroundColor="var(--heart-blue-500)"
                            textColor="white"
                            borderColor="var(--heart-blue-700)"
                            showArrow={false}
                        >
                            <button className="px-4 py-2 rounded-md border border-[var(--heart-blue-500)] text-[var(--heart-blue-500)]">
                                Custom style
                            </button>
                        </FloatingTooltip>
                    </ExampleCard>

                    {/* Using with cursor system */}
                    <ExampleCard title="With Cursor System">
                        <CursorAwareTooltip />
                    </ExampleCard>

                    {/* Rich content with cursor mode - NEW! */}
                    <ExampleCard title="Rich Content Cursor">
                        <FloatingTooltip
                            content={
                                <div className="flex flex-col gap-2">
                                    <div className="font-medium">Rich Cursor Content</div>
                                    <div className="text-xs">Follows your cursor with rich content!</div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    </div>
                                </div>
                            }
                            cursorMode={true}
                            cursorAnimation="smooth"
                        >
                            <button className="px-4 py-2 rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                Floating rich content
                            </button>
                        </FloatingTooltip>
                    </ExampleCard>

                    {/* Using hook approach */}
                    <ExampleCard title="Hook Approach">
                        <HookBasedTooltip />
                    </ExampleCard>

                    {/* Cursor Mode with Hook - NEW! */}
                    <ExampleCard title="Hook with Cursor Mode">
                        <CursorModeHookTooltip />
                    </ExampleCard>
                </div>
            </div>
        </>
    );
}

/**
 * Example of tooltip integration with custom cursor
 */
function CursorAwareTooltip() {
    // Using the hover cursor for integration with cursor system
    const cursorProps = useHoverCursor({
        content: <span>This appears in custom cursor!</span>,
        showContent: true,
    });

    return (
        <FloatingTooltip
            content="This tooltip works alongside the cursor!"
            position="top"
            backgroundColor="var(--heart-cyan-500)"
            textColor="white"
        >
            <button
                {...cursorProps}
                className={cn('px-4 py-2 rounded-md bg-[var(--heart-cyan-500)] text-white', cursorProps.className)}
            >
                Hover for both
            </button>
        </FloatingTooltip>
    );
}

/**
 * Example of using the useFloatingTooltip hook
 */
function HookBasedTooltip() {
    const { tooltipProps, triggerProps } = useFloatingTooltip({
        content: 'This tooltip uses the hook approach',
        position: 'top-right',
        delayShow: 200,
        integrateCursor: true,
    });

    return (
        <FloatingTooltip {...tooltipProps}>
            <button
                {...triggerProps}
                className={cn(
                    'px-4 py-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-secondary)]',
                    triggerProps.className,
                )}
            >
                Hook-based tooltip
            </button>
        </FloatingTooltip>
    );
}

/**
 * Example of cursor mode tooltip using the hook approach
 */
function CursorModeHookTooltip() {
    const { tooltipProps, triggerProps } = useFloatingTooltip({
        content: "I'm a floating tooltip cursor using the hook!",
        cursorMode: true,
        cursorAnimation: 'elastic',
        backgroundColor: 'var(--heart-cyan-500)',
        textColor: 'white',
        borderColor: 'var(--heart-cyan-700)',
        delayShow: 50,
    });

    return (
        <FloatingTooltip {...tooltipProps}>
            <button
                {...triggerProps}
                className={cn('px-4 py-2 rounded-md bg-[var(--heart-cyan-500)] text-white', triggerProps.className)}
            >
                Hook cursor tooltip
            </button>
        </FloatingTooltip>
    );
}

/**
 * Card component to display each example
 */
function ExampleCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-3">
            <h2 className="text-lg font-medium">{title}</h2>
            <div className="flex items-center justify-center p-4">{children}</div>
        </div>
    );
}
