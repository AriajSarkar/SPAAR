import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs - Class names to be combined
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Detects if the user is on a touch device
 * Uses both pointer media query and touch capability checks
 * @returns true if the device is a touch device
 */
export function isTouchDevice(): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        return false;
    }

    // Check for touch capabilities
    const hasTouchCapability = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check for pointer media query which indicates if a device's primary input is touch
    const prefersTouchMedia = window.matchMedia('(pointer: coarse)').matches;

    return hasTouchCapability || prefersTouchMedia;
}
