/**
 * API client for authentication
 * Handles interactions with authentication endpoints
 */

// Base URL for API - can be configured based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * User profile data structure
 */
export interface UserProfile {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

/**
 * Auth response structure
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
  tokens?: {
    access: string;
    refresh: string;
  };
}

/**
 * Login a user with email and password
 * 
 * @param credentials Login credentials
 * @returns Promise with auth response
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Login failed',
      };
    }

    return {
      success: true,
      user: data.user,
      tokens: data.tokens
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed due to an unexpected error',
    };
  }
}

/**
 * Register a new user
 * 
 * @param userData Registration data
 * @returns Promise with auth response
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Registration failed',
      };
    }

    return {
      success: true,
      message: 'Registration successful',
      user: data.user,
      tokens: data.tokens
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed due to an unexpected error',
    };
  }
}

/**
 * Logout the current user
 * 
 * @returns Promise with auth response
 */
export async function logout(): Promise<AuthResponse> {
  try {
    // Get refresh token from cookie since it's not HTTP-only (httponly=False in backend)
    const refreshToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('refresh_token='))
      ?.split('=')[1];
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
      body: JSON.stringify({ 
        refresh_token: refreshToken || '' // Send the actual refresh token from cookie
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        message: data.error || 'Logout failed',
      };
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'Logout failed due to an unexpected error',
    };
  }
}

/**
 * Refresh the authentication token
 * 
 * @returns Promise with auth response
 */
export async function refreshToken(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        message: data.error || 'Token refresh failed',
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Token refreshed successfully',
      tokens: data.tokens
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      message: 'Token refresh failed due to an unexpected error',
    };
  }
}

/**
 * Get the current user's profile
 * 
 * @returns Promise with auth response containing user profile
 */
export async function getUserProfile(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        message: data.error || 'Failed to get user profile',
      };
    }

    const user = await response.json();
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      message: 'Failed to get user profile due to an unexpected error',
    };
  }
}