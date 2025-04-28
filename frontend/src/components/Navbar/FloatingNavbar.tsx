'use client';

import { useState, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { ThemeToggle } from '../theme/ThemeToggle';
import Link from 'next/link';
import { RiRobot2Line, RiMessage3Line } from '@remixicon/react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useAuth } from '@/lib/auth/AuthContext';

// Import our extracted components
import { NavItem } from './NavItem';
import { MobileMenuDropdown } from './Mobile/MobileMenuDropdown';
import { UserMenuDropdown } from './UserMenuDropdown';
import { MobileUserMenu } from './Mobile/MobileUserMenu';
import { UserProfileButton, MobileUserProfileButton } from './UserProfileButton';
import { MobileMenuButton } from './Mobile/MobileMenuButton';

/**
 * Floating navigation bar inspired by Aceternity UI
 * Includes theme toggle and key navigation items
 * Features scroll-based visibility: hides on scroll down, shows on scroll up
 */
export function FloatingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    // Get authentication state from context
    const { user, loading, logout, isAuthenticated } = useAuth();

    // Skip authentication check on login and register pages
    const isAuthPage = pathname === '/login' || pathname === '/register';

    // Handle scrolling effects
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // At the top - always visible
            if (currentScrollY < 20) {
                setIsScrolled(false);
                setIsVisible(true);
            } else {
                setIsScrolled(true);

                // Determine scroll direction
                // When scrolling up (or at top) -> show navbar
                // When scrolling down -> hide navbar
                if (currentScrollY < lastScrollY || currentScrollY < 50) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                    // Close mobile menu when hiding navbar
                    if (isMobileMenuOpen) {
                        setIsMobileMenuOpen(false);
                    }
                }
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY, isMobileMenuOpen]);

    // Handle user logout
    const handleLogout = async () => {
        try {
            await logout();
            setUserMenuOpen(false);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    // Toggle user profile menu
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    // Close user menu
    const closeUserMenu = () => setUserMenuOpen(false);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-3 sm:px-6 md:px-8">
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: isVisible ? 0 : -100,
                    opacity: isVisible ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className={`
          w-full max-w-screen-lg rounded-full border border-[var(--color-border)] 
          backdrop-blur-md transition-all duration-300 
          ${isScrolled ? 'bg-background/80 shadow-lg' : 'bg-background/50'}
          flex items-center justify-between px-4 py-2 sm:px-6
        `}
            >
                {/* Logo and Brand */}
                <Link href="/" className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ rotate: 15 }}
                        className="flex items-center justify-center rounded-full bg-[var(--heart-blue-500)] p-2 text-white"
                    >
                        <RiRobot2Line className="h-5 w-5" />
                    </motion.div>
                    <span className="hidden font-medium sm:inline-block">Heart Chat</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-1 md:flex">
                    <NavItem href="/chat" icon={<RiMessage3Line className="h-5 w-5" />} label="Chat" />

                    {/* Authentication and User Menu */}
                    {loading ? (
                        <div className="h-10 w-10 rounded-full bg-[var(--color-secondary)] animate-pulse"></div>
                    ) : isAuthenticated ? (
                        <div className="relative">
                            <UserProfileButton 
                                user={user} 
                                onClick={toggleUserMenu}
                                expanded={userMenuOpen}
                            />

                            {userMenuOpen && (
                                <UserMenuDropdown 
                                    user={user}
                                    onClose={closeUserMenu}
                                    onLogout={handleLogout}
                                />
                            )}
                        </div>
                    ) : (
                        !isAuthPage && (
                            <>
                                <Link href="/login" className="rounded-full overflow-hidden">
                                    <Button variant="outline" size="sm" className="rounded-full">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href="/register" className="rounded-full overflow-hidden">
                                    <Button variant="default" size="sm" className="rounded-full">
                                        Register
                                    </Button>
                                </Link>
                            </>
                        )
                    )}
                    <ThemeToggle />
                </div>

                {/* Mobile Navigation Button */}
                <div className="flex items-center gap-2 md:hidden">
                    {/* User profile button for mobile */}
                    {!loading && isAuthenticated && (
                        <MobileUserProfileButton 
                            user={user} 
                            onClick={toggleUserMenu}
                        />
                    )}

                    <ThemeToggle />
                    <MobileMenuButton 
                        isOpen={isMobileMenuOpen}
                        onClick={toggleMobileMenu}
                    />
                </div>
            </motion.div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <MobileMenuDropdown 
                    isAuthenticated={isAuthenticated}
                    isAuthPage={isAuthPage}
                    loading={loading}
                    onLogout={handleLogout}
                />
            )}

            {/* Mobile User Menu Dropdown */}
            {userMenuOpen && !isMobileMenuOpen && (
                <MobileUserMenu 
                    user={user}
                    onLogout={handleLogout}
                />
            )}
        </div>
    );
}
