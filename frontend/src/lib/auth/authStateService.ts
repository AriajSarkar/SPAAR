import { UserProfile } from '../api/auth';

/**
 * Auth state storage keys
 */
const AUTH_USER_KEY = 'auth_user_data';
const AUTH_TIMESTAMP_KEY = 'auth_last_verified';

/**
 * Max age of cached auth data in milliseconds (5 minutes)
 */
const MAX_AUTH_CACHE_AGE = 5 * 60 * 1000;

/**
 * Service for managing authentication state client-side
 * Provides methods to check auth status without constant API calls
 */
export const authStateService = {
    /**
     * Store user data in memory and localStorage
     */
    setUserData(userData: UserProfile | null): void {
        if (typeof window === 'undefined') return;

        if (userData) {
            // Store in localStorage (avoid storing sensitive data)
            const safeUserData = {
                id: userData.id,
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
                created_at: userData.created_at,
            };

            try {
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(safeUserData));
                // Set timestamp for cache validation
                localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
            } catch (err) {
                console.error('Failed to store auth data:', err);
            }
        } else {
            // Clear auth data on logout
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_TIMESTAMP_KEY);
        }
    },

    /**
     * Retrieve cached user data
     */
    getUserData(): UserProfile | null {
        if (typeof window === 'undefined') return null;

        try {
            const userData = localStorage.getItem(AUTH_USER_KEY);
            if (!userData) return null;

            return JSON.parse(userData) as UserProfile;
        } catch (err) {
            console.error('Failed to retrieve auth data:', err);
            return null;
        }
    },

    /**
     * Check if cached auth data is still valid
     */
    isAuthCacheValid(): boolean {
        if (typeof window === 'undefined') return false;

        try {
            // Check if we have a user
            const userData = localStorage.getItem(AUTH_USER_KEY);
            if (!userData) return false;

            // Check if timestamp exists and is recent enough
            const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
            if (!timestamp) return false;

            const lastVerified = parseInt(timestamp, 10);
            const now = Date.now();

            // Valid if cache is fresh (within MAX_AUTH_CACHE_AGE)
            return now - lastVerified < MAX_AUTH_CACHE_AGE;
        } catch (err) {
            console.error('Error checking auth cache validity:', err);
            return false;
        }
    },

    /**
     * Update the timestamp to extend cache validity
     */
    updateAuthTimestamp(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
        } catch (err) {
            console.error('Failed to update auth timestamp:', err);
        }
    },

    /**
     * Clear all auth data (for logout)
     */
    clearAuthData(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(AUTH_USER_KEY);
            localStorage.removeItem(AUTH_TIMESTAMP_KEY);
        } catch (err) {
            console.error('Failed to clear auth data:', err);
        }
    },
};
