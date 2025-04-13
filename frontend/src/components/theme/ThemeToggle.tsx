"use client";

import { useTheme } from "./ThemeProvider";
import { RiMoonLine, RiSunLine } from "@remixicon/react";

/**
 * A toggle button component for switching between light and dark themes
 */
export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            type="button"
            className="flex items-center justify-center p-2 rounded-full transition-colors hover:bg-[var(--heart-blue-500)] hover:text-white"
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
            {theme === "light" ? (
                <RiMoonLine className="w-5 h-5" />
            ) : (
                <RiSunLine className="w-5 h-5" />
            )}
        </button>
    );
}