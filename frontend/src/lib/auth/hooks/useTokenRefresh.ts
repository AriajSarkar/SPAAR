'use client';

import { useState, useCallback } from 'react';
import { tokenUtils } from '../tokenUtils';
import { authStateService } from '../authStateService';

/**
 * Hook for handling token refresh operations
 * Uses the /api/auth/refresh/ endpoint directly instead of profile endpoint
 */
export function useTokenRefresh() {
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Refresh the access token using the refresh token
     */
    const refreshToken = useCallback(async (): Promise<boolean> => {
        setRefreshing(true);
        setError(null);

        try {
            // Only attempt refresh if refresh token exists and is valid
            if (!tokenUtils.isRefreshTokenValid()) {
                setError('No valid refresh token available');
                return false;
            }

            // Use the token refresh functionality
            const success = await tokenUtils.refreshToken();

            if (success) {
                // Update the timestamp in our user data cache
                authStateService.updateAuthTimestamp();
                return true;
            } else {
                setError('Token refresh failed');
                return false;
            }
        } catch (err) {
            console.error('Token refresh error:', err);
            setError('Error refreshing token');
            return false;
        } finally {
            setRefreshing(false);
        }
    }, []);

    /**
     * Check if token refresh is needed based on expiration time
     */
    const shouldRefreshToken = useCallback((): boolean => {
        return tokenUtils.shouldRefreshToken();
    }, []);

    return {
        refreshToken,
        shouldRefreshToken,
        refreshing,
        error,
    };
}
