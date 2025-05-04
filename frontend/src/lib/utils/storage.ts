/**
 * Safe storage utility for handling localStorage operations with error protection
 * Uses non-blocking operations to preserve UI responsiveness
 */

/**
 * Type-safe wrapper for localStorage with error handling and non-blocking operations
 */
export const safeStorage = {
    /**
     * Get an item from localStorage safely
     * @param key The key to retrieve
     * @param defaultValue Default value to return if key doesn't exist or operation fails
     * @returns The stored value or defaultValue
     */
    getItem<T>(key: string, defaultValue: T): T {
        try {
            if (typeof localStorage === 'undefined') {
                return defaultValue;
            }

            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;

            try {
                return JSON.parse(value) as T;
            } catch {
                // If the value isn't valid JSON, return it as is
                return value as unknown as T;
            }
        } catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
            return defaultValue;
        }
    },

    /**
     * Set an item in localStorage safely
     * @param key The key to store under
     * @param value The value to store
     * @returns Promise that resolves when operation is complete
     */
    setItem(key: string, value: unknown): Promise<void> {
        return new Promise<void>((resolve) => {
            // Use microtask to avoid blocking the main thread
            queueMicrotask(() => {
                try {
                    if (typeof localStorage !== 'undefined') {
                        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                        localStorage.setItem(key, serialized);
                    }
                    resolve();
                } catch (error) {
                    console.error(`Error writing to localStorage: ${key}`, error);
                    resolve(); // Still resolve to avoid hanging promises
                }
            });
        });
    },

    /**
     * Remove an item from localStorage safely
     * @param key The key to remove
     * @returns Promise that resolves when operation is complete
     */
    removeItem(key: string): Promise<void> {
        return new Promise<void>((resolve) => {
            // Use microtask to avoid blocking the main thread
            queueMicrotask(() => {
                try {
                    if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem(key);
                    }
                    resolve();
                } catch (error) {
                    console.error(`Error removing from localStorage: ${key}`, error);
                    resolve(); // Still resolve to avoid hanging promises
                }
            });
        });
    },

    /**
     * Check if a key exists in localStorage
     * @param key The key to check
     * @returns Whether the key exists
     */
    hasItem(key: string): boolean {
        try {
            if (typeof localStorage === 'undefined') {
                return false;
            }
            return localStorage.getItem(key) !== null;
        } catch (error) {
            console.error(`Error checking localStorage for key: ${key}`, error);
            return false;
        }
    },

    /**
     * Get all keys in localStorage that match a prefix
     * @param prefix The prefix to match (optional)
     * @returns Array of matching keys
     */
    getKeys(prefix?: string): string[] {
        try {
            if (typeof localStorage === 'undefined') {
                return [];
            }

            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (!prefix || key.startsWith(prefix))) {
                    keys.push(key);
                }
            }
            return keys;
        } catch (error) {
            console.error('Error getting keys from localStorage', error);
            return [];
        }
    },

    /**
     * Clear all items from localStorage
     * @param prefix Only clear items with this prefix (optional)
     * @returns Promise that resolves when operation is complete
     */
    clear(prefix?: string): Promise<void> {
        return new Promise<void>((resolve) => {
            queueMicrotask(() => {
                try {
                    if (typeof localStorage === 'undefined') {
                        resolve();
                        return;
                    }

                    if (prefix) {
                        const keysToRemove = this.getKeys(prefix);
                        keysToRemove.forEach((key) => {
                            localStorage.removeItem(key);
                        });
                    } else {
                        localStorage.clear();
                    }
                    resolve();
                } catch (error) {
                    console.error('Error clearing localStorage', error);
                    resolve(); // Still resolve to avoid hanging promises
                }
            });
        });
    },
};

/**
 * Constants for localStorage keys used in the application
 */
export const STORAGE_KEYS = {
    SESSION_ID: 'chat_session_id',
    CONVERSATIONS: 'heart_chat_conversations',
    CONVERSATION_PREFIX: 'heart_chat_conversation_',
    THEME: 'theme',
    USER_PREFERENCES: 'user_preferences',
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    LAST_ACTIVE: 'last_active_timestamp',
};
