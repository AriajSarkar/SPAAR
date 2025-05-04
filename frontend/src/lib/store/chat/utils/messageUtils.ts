import { generateSessionId } from '@/lib/api-client';

/**
 * Generate a unique ID for messages
 */
export function generateMessageId(): string {
    return generateSessionId();
}

/**
 * Safely store and retrieve data from localStorage.
 * Handles missing localStorage (SSR) and parsing errors.
 */
export const safeStorage = {
    setItem<T>(key: string, value: T): void {
        try {
            if (typeof window === 'undefined') return;
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error setting localStorage item:', e);
        }
    },

    getItem<T>(key: string, defaultValue: T): T {
        try {
            if (typeof window === 'undefined') return defaultValue;

            const item = localStorage.getItem(key);
            if (!item) return defaultValue;

            return JSON.parse(item) as T;
        } catch (e) {
            console.error('Error getting localStorage item:', e);
            return defaultValue;
        }
    },

    removeItem(key: string): void {
        try {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing localStorage item:', e);
        }
    },
};

export const SESSION_ID_KEY = 'chat_session_id';

/**
 * Format a long message into a suitable title
 */
export function formatMessageAsTitle(message: string): string {
    return message.length > 40 ? `${message.substring(0, 37)}...` : message;
}
