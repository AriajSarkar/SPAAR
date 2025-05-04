'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { authStateService } from './authStateService';
import { tokenUtils } from './tokenUtils';

/**
 * Options for the authentication check
 */
interface UseAuthCheckOptions {
    /** Whether to redirect to login page if not authenticated */
    redirectToLogin?: boolean;
    /** Whether to refresh the profile only when cache is invalid */
    refreshIfNeeded?: boolean;
    /** Route to redirect to if not authenticated */
    loginRoute?: string;
}

/**
 * Hook for efficiently checking authentication status in components
 * Minimizes API calls by leveraging token refresh and local validation
 */
export function useAuthCheck(options: UseAuthCheckOptions = {}) {
    const { redirectToLogin = false, refreshIfNeeded = true, loginRoute = '/login' } = options;

    const { user, loading, error, isAuthenticated, refreshUserProfile, logout } = useAuth();
    const router = useRouter();
    const [tokenRefreshing, setTokenRefreshing] = useState(false);

    /**
     * Handles token refresh without calling profile endpoint
     * Uses the /api/auth/refresh/ endpoint directly
     */
    const refreshTokenIfNeeded = useCallback(async () => {
        // Only refresh if near expiration
        if (tokenUtils.shouldRefreshToken()) {
            setTokenRefreshing(true);
            try {
                await tokenUtils.refreshToken();
                // Just update the timestamp of our cache to keep it valid
                if (user) {
                    authStateService.updateAuthTimestamp();
                }
            } catch (err) {
                console.error('Token refresh error:', err);
            } finally {
                setTokenRefreshing(false);
            }
        }
    }, [user]);

    // Check auth status on mount and handle token refresh
    useEffect(() => {
        // If no user but we have tokens, try refreshing tokens first
        if (!user && !loading && tokenUtils.isRefreshTokenValid()) {
            refreshTokenIfNeeded();
        }

        // If we have a user, just refresh tokens if needed
        if (user) {
            refreshTokenIfNeeded();
            authStateService.updateAuthTimestamp();
            return;
        }

        // If loading, don't do anything
        if (loading || tokenRefreshing) return;

        // If not authenticated and redirectToLogin is true, redirect
        if (!isAuthenticated && redirectToLogin) {
            router.push(loginRoute);
        }

        // Only refresh profile if cache is invalid and refreshIfNeeded is true
        if (refreshIfNeeded && !authStateService.isAuthCacheValid() && tokenUtils.isAccessTokenValid()) {
            refreshUserProfile();
        }
    }, [
        user,
        loading,
        refreshUserProfile,
        refreshIfNeeded,
        isAuthenticated,
        redirectToLogin,
        loginRoute,
        router,
        tokenRefreshing,
        refreshTokenIfNeeded,
    ]);

    return {
        user,
        loading: loading || tokenRefreshing,
        error,
        isAuthenticated,
        refreshUserProfile,
        refreshTokenIfNeeded,
        logout, // Add logout function to the returned object
    };
}
