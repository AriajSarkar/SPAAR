import { jwtDecode } from 'jwt-decode';
import { tokenService } from './services/tokenService';

interface TokenPayload {
    sub: string;
    exp: number;
    iat: number;
}

/**
 * Utility functions for token management
 * Reduces need for backend API calls for auth status
 */
export const tokenUtils = {
    /**
     * Get access token from cookies
     */
    getAccessToken(): string | null {
        if (typeof document === 'undefined') return null;

        return (
            document.cookie
                .split('; ')
                .find((row) => row.startsWith('access_token='))
                ?.split('=')[1] || null
        );
    },

    /**
     * Get refresh token from cookies
     */
    getRefreshToken(): string | null {
        if (typeof document === 'undefined') return null;

        return (
            document.cookie
                .split('; ')
                .find((row) => row.startsWith('refresh_token='))
                ?.split('=')[1] || null
        );
    },

    /**
     * Check if access token exists and is still valid
     */
    isAccessTokenValid(): boolean {
        try {
            const token = this.getAccessToken();
            if (!token) return false;

            const payload = jwtDecode<TokenPayload>(token);
            const currentTime = Math.floor(Date.now() / 1000);

            return payload.exp > currentTime;
        } catch (error) {
            console.error('Error validating access token:', error);
            return false;
        }
    },

    /**
     * Check if refresh token exists and is still valid
     */
    isRefreshTokenValid(): boolean {
        try {
            const token = this.getRefreshToken();
            if (!token) return false;

            const payload = jwtDecode<TokenPayload>(token);
            const currentTime = Math.floor(Date.now() / 1000);

            return payload.exp > currentTime;
        } catch (error) {
            console.error('Error validating refresh token:', error);
            return false;
        }
    },

    /**
     * Get time until token expiration in seconds
     * Returns -1 if token is invalid or expired
     */
    getAccessTokenTimeRemaining(): number {
        try {
            const token = this.getAccessToken();
            if (!token) return -1;

            const payload = jwtDecode<TokenPayload>(token);
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp <= currentTime) return -1;
            return payload.exp - currentTime;
        } catch (error) {
            console.error('Error getting token expiration time:', error);
            return -1;
        }
    },

    /**
     * Check if token needs refresh (less than 5 minutes remaining)
     */
    shouldRefreshToken(): boolean {
        const timeRemaining = this.getAccessTokenTimeRemaining();
        // Refresh if less than 5 minutes remaining
        return timeRemaining > 0 && timeRemaining < 300;
    },

    /**
     * Refreshes the access token using the refresh endpoint
     * Returns a boolean indicating success
     */
    async refreshToken(): Promise<boolean> {
        try {
            // Only attempt refresh if refresh token is valid
            if (!this.isRefreshTokenValid()) {
                return false;
            }

            const result = await tokenService.refreshAccessToken();
            return result.success;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    },
};
