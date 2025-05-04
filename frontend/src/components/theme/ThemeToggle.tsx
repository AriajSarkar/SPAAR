'use client';

import { useTheme } from './ThemeProvider';
import { RiMoonLine, RiSunLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * A toggle button component for switching between light and dark themes
 * Uses shadcn/ui Button component for consistent styling
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            onClick={toggleTheme}
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
                'rounded-full w-9 h-9',
                'data-[state=light]:bg-transparent data-[state=light]:text-[var(--foreground)]',
                'data-[state=dark]:bg-transparent data-[state=dark]:text-[var(--foreground)]',
                'hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)]',
                className,
            )}
            data-state={theme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
            {theme === 'light' ? <RiMoonLine className="h-5 w-5" /> : <RiSunLine className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
