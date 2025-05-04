import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';

/**
 * Response type for token refresh operations
 */
interface TokenRefreshResponse {
    success: boolean;
    access?: string;
    refresh?: string;
    error?: string;
}

/**
 * Error response type from API
 */
interface ApiErrorResponse {
    detail?: string;
    error?: string;
    message?: string;
}

/**
 * Service for token management operations
 * Handles token refresh without requiring profile endpoint calls
 */
export const tokenService = {
    /**
     * Refresh the access token using the refresh token
     * Uses the /api/auth/refresh/ endpoint directly to minimize API calls
     */
    refreshAccessToken: async (): Promise<TokenRefreshResponse> => {
        try {
            // Send a POST request to the refresh endpoint
            // No need to send tokens in the body as they're in HTTP-only cookies
            const response = await apiClient.post('/api/auth/refresh/');

            return {
                success: true,
                access: response.data.access,
                refresh: response.data.refresh,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;

            return {
                success: false,
                error:
                    axiosError.response?.data?.detail ||
                    axiosError.response?.data?.error ||
                    axiosError.response?.data?.message ||
                    'Failed to refresh token',
            };
        }
    },
};
