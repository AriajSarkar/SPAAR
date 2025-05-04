'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout as logoutApi, getUserProfile } from '../api/auth';
import { UserProfile } from '../api/auth';
import { authStateService } from './authStateService';
import { tokenUtils } from './tokenUtils';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (tokens: { access: string; refresh: string }, userData: UserProfile) => void;
    logout: () => Promise<void>;
    refreshUserProfile: () => Promise<void>;
}

// Default context value
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    login: () => {},
    logout: async () => {},
    refreshUserProfile: async () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Skip authentication check on login and register pages
    const isAuthPage = pathname === '/login' || pathname === '/register';

    useEffect(() => {
        if (isAuthPage) {
            setLoading(false);
            return;
        }

        const checkAuth = async () => {
            setLoading(true);
            setError(null);

            try {
                // Step 1: Check if we have a valid access token
                if (!tokenUtils.isAccessTokenValid()) {
                    // No valid access token, but we might have a valid refresh token
                    if (tokenUtils.isRefreshTokenValid()) {
                        // Try to refresh the token using our dedicated refresh endpoint
                        const refreshSuccessful = await tokenUtils.refreshToken();
                        if (!refreshSuccessful) {
                            // Refresh failed, clear everything
                            setUser(null);
                            authStateService.clearAuthData();
                            setLoading(false);
                            return;
                        }
                        // Token refreshed successfully, continue with auth check
                    } else {
                        // No valid tokens at all, user is not authenticated
                        setUser(null);
                        authStateService.clearAuthData();
                        setLoading(false);
                        return;
                    }
                }

                // Step 2: Try to get user from cache if tokens are valid
                if (authStateService.isAuthCacheValid()) {
                    const cachedUser = authStateService.getUserData();
                    if (cachedUser) {
                        setUser(cachedUser);
                        setLoading(false);
                        return;
                    }
                }

                // Step 3: If tokens are valid but cache is invalid, make an API call
                // This is the only place we'll need to call the profile endpoint
                const response = await getUserProfile();

                if (response.success && response.user) {
                    setUser(response.user);
                    // Update cache with fresh data
                    authStateService.setUserData(response.user);
                } else {
                    setUser(null);
                    authStateService.clearAuthData();
                }
            } catch (err) {
                console.error('Error checking authentication:', err);
                setError('Authentication check failed');
                setUser(null);
                authStateService.clearAuthData();
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [isAuthPage, pathname]);

    // Save authentication data - no localStorage, cookies are handled by the browser
    const handleLogin = (tokens: { access: string; refresh: string }, userData: UserProfile) => {
        // We don't need to manually store tokens as they're in HTTP-only cookies now
        setUser(userData);
        // Cache the user data
        authStateService.setUserData(userData);
    };

    // Handle logout
    const handleLogout = async () => {
        setLoading(true);
        try {
            await logoutApi();
            setUser(null);
            // Clear cached auth data
            authStateService.clearAuthData();
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
            setError('Logout failed');
        } finally {
            setLoading(false);
        }
    };

    // Refresh user profile data - still needed for explicit refreshes
    const refreshUserProfile = async () => {
        setLoading(true);
        try {
            const response = await getUserProfile();
            if (response.success && response.user) {
                setUser(response.user);
                // Update cache with fresh data
                authStateService.setUserData(response.user);
            }
        } catch (err) {
            console.error('Error refreshing user profile:', err);
            setError('Failed to refresh profile');
        } finally {
            setLoading(false);
        }
    };

    const contextValue: AuthContextType = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
        refreshUserProfile,
    };

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
