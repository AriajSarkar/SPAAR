'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuthCheck } from '@/lib/auth/useAuthCheck';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import Link from 'next/link';
import { RiSettings4Line, RiLogoutBoxLine, RiUserLine, RiInformationLine, RiPaintBrushLine } from '@remixicon/react';

interface ProfileMenuProps {
    onClose: () => void;
}

export function ProfileMenu({ onClose }: ProfileMenuProps) {
    // Using our new useAuthCheck hook - no need to call refreshUserProfile unnecessarily
    const { user, logout } = useAuthCheck({ refreshIfNeeded: false });
    const [activeTab, setActiveTab] = useState('profile');

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user) return 'U';
        return `${(user.first_name?.[0] || '').toUpperCase()}${(user.last_name?.[0] || '').toUpperCase()}` || 'U';
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle logout click
    const handleLogout = async () => {
        await logout();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md"
            >
                <Card className="border border-[var(--border)] bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[var(--heart-blue-500)] text-white">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-medium text-foreground">
                                    {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User'}
                                </h3>
                                <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <span className="sr-only">Close</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x"
                            >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </Button>
                    </div>

                    <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 bg-muted rounded-none border-b border-[var(--border)] w-full">
                            <TabsTrigger value="profile" className="data-[state=active]:bg-card">
                                <RiUserLine className="mr-2 h-4 w-4" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="data-[state=active]:bg-card">
                                <RiSettings4Line className="mr-2 h-4 w-4" />
                                Settings
                            </TabsTrigger>
                            <TabsTrigger value="about" className="data-[state=active]:bg-card">
                                <RiInformationLine className="mr-2 h-4 w-4" />
                                About
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="p-4 space-y-4">
                            <div className="space-y-4">
                                <div className="flex flex-col space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                                    <span className="text-foreground">
                                        {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User'}
                                    </span>
                                </div>

                                <div className="flex flex-col space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">Email</span>
                                    <span className="text-foreground">{user?.email || 'example@email.com'}</span>
                                </div>

                                <div className="pt-4">
                                    <Link href="/profile">
                                        <Button variant="outline" className="w-full">
                                            View full profile
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="p-4 space-y-4">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-medium text-foreground flex items-center">
                                            <RiPaintBrushLine className="mr-2 h-4 w-4 text-[var(--heart-blue-500)]" />
                                            Theme
                                        </div>
                                        <div className="text-xs text-muted-foreground">Customize the appearance</div>
                                    </div>
                                    <ThemeToggle />
                                </div>

                                <div className="pt-4">
                                    <Button variant="destructive" onClick={handleLogout} className="w-full">
                                        <RiLogoutBoxLine className="mr-2 h-4 w-4" />
                                        Log out
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="about" className="p-4 space-y-4">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-8 h-8 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-1">AI Assistant</h3>
                                <p className="text-sm text-muted-foreground mb-4">Version 1.0.0</p>
                                <p className="text-sm text-muted-foreground">
                                    Powered by advanced AI models to help answer your questions and assist with various
                                    tasks.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>
            </motion.div>
        </div>
    );
}
