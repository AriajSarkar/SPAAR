"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { login as loginApi, logout as logoutApi, getUserProfile, AuthResponse } from "../api/auth";
import { UserProfile } from "../api/auth";

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
  refreshUserProfile: async () => {}
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
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Check authentication status on mount and when path changes
  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getUserProfile();
        
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          setUser(null);
          
          // If not on auth page and not authenticated, redirect to login
          if (!isAuthPage) {
            router.push("/login");
          }
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        setError("Authentication check failed");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthPage, pathname, router]);

  // Save authentication data - no localStorage, cookies are handled by the browser
  const handleLogin = (tokens: { access: string; refresh: string }, userData: UserProfile) => {
    // We don't need to manually store tokens as they're in HTTP-only cookies now
    setUser(userData);
  };

  // Handle logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutApi();
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile data
  const refreshUserProfile = async () => {
    setLoading(true);
    try {
      const response = await getUserProfile();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (err) {
      console.error("Error refreshing user profile:", err);
      setError("Failed to refresh profile");
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
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}