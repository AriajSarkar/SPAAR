import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenUtils } from '@/lib/auth/tokenUtils';

/**
 * API client for backend interactions
 * This file re-exports all the functionality from the modular structure
 */

// Re-export LLM API functions
export { generateLLMResponse } from './api/llm';

// Re-export conversation API functions
export { getConversationHistory, deleteConversation, getAllConversations } from './api/conversation';

// Re-export user content API functions
// export {
//   getUserContentHistory,
//   getUserContentForSession
// } from './api/user-content';

// Re-export authentication API functions
export { login, register, logout, refreshToken, getUserProfile } from './api/auth';

// Re-export conversation storage types and functions
export { type ConversationSummary, CONVERSATIONS_STORAGE_KEY } from './storage/conversation';

// Re-export utility functions
export { generateSessionId } from './utils/id';
export { simulateStreamingResponse } from './utils/streams';

/**
 * API client with interceptors for authentication
 * Handles token refresh automatically without manual profile calls
 */
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies
});

// Request interceptor to handle token refresh before requests
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Skip token refresh for auth endpoints to prevent loops
        const isAuthEndpoint = config.url?.startsWith('/api/auth/');
        const isRefreshEndpoint = config.url === '/api/auth/refresh/';

        if (!isAuthEndpoint || isRefreshEndpoint) {
            try {
                // Check if token needs refresh (less than 5 minutes remaining)
                if (tokenUtils.shouldRefreshToken()) {
                    // Attempt to refresh the token silently
                    await tokenUtils.refreshToken();
                }
            } catch (error) {
                console.error('Token refresh failed in interceptor:', error);
                // Continue with request even if refresh fails
                // The server will return 401 if token is invalid
            }
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor to handle token refresh on 401 errors
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only retry once per request
        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        // If error is 401 Unauthorized and not from an auth endpoint
        if (
            error.response?.status === 401 &&
            originalRequest.url &&
            !originalRequest.url.startsWith('/api/auth/') &&
            tokenUtils.isRefreshTokenValid()
        ) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const refreshed = await tokenUtils.refreshToken();

                if (refreshed) {
                    // Retry original request
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed on 401:', refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export { apiClient };
