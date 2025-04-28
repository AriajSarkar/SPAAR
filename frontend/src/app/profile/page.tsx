"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, error: authError, refreshUserProfile } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Check authentication status on mount
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    
    // Refresh user profile data to ensure it's up-to-date
    refreshUserProfile();
  }, [loading, user, router, refreshUserProfile]);

  // Handle logout
  const handleLogout = async () => {
    setLocalLoading(true);
    try {
      await logout();
      // Logout will redirect to login page via the AuthContext
    } catch (err) {
      setLocalError("Failed to log out. Please try again.");
      console.error("Logout error:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/chat" 
            className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Back to Chat
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            disabled={localLoading || loading}
          >
            {localLoading ? "Logging out..." : "Log out"}
          </Button>
        </div>

        {(localError || authError) && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
            {localError || authError}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-t-2 border-l-2 border-[color:var(--heart-blue-500)] rounded-full"></div>
          </div>
        ) : user ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 bg-card">
              <h2 className="text-lg font-medium mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Email
                  </label>
                  <div className="font-medium">{user.email}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    Full Name
                  </label>
                  <div className="font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    User ID
                  </label>
                  <div className="text-sm font-mono bg-muted p-2 rounded">
                    {user.id}
                  </div>
                </div>
                
                {user.created_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Account Created
                    </label>
                    <div className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()} at{" "}
                      {new Date(user.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            <Card className="p-6 bg-card">
              <h2 className="text-lg font-medium mb-4">Chat Activity</h2>
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-muted-foreground mb-4">
                  View your recent chat conversations
                </p>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => router.push("/chat")}
                >
                  Go to Chat
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-6 bg-card text-center">
            <p className="mb-4">Failed to load profile information</p>
            <Button 
              variant="default" 
              size="sm"
              onClick={refreshUserProfile}
            >
              Try Again
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}