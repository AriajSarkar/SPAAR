/**
 * Authentication module for efficient client-side auth management
 * Minimizes API calls while maintaining secure authentication state
 */

// Context and providers
export { AuthProvider, useAuth } from './AuthContext';

// Hooks for optimized auth checks
export { useAuthCheck } from './useAuthCheck';
export { useTokenRefresh } from './hooks/useTokenRefresh';

// HOC for protecting routes
export { withAuth } from './withAuth';

// Utility functions
export { tokenUtils } from './tokenUtils';
export { authStateService } from './authStateService';
