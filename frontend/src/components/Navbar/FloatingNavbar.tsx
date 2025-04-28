"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ThemeToggle } from "../theme/ThemeToggle";
import Link from "next/link";
import { RiRobot2Line, RiMessage3Line, RiUser3Line, RiLogoutBoxRLine } from "@remixicon/react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/auth/AuthContext";

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
    const isAuthPage = pathname === "/login" || pathname === "/register";

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

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY, isMobileMenuOpen]);

    // Handle user logout
    const handleLogout = async () => {
        try {
            await logout();
            setUserMenuOpen(false);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    
    // Toggle user profile menu
    const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-3 sm:px-6 md:px-8">
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: isVisible ? 0 : -100,
                    opacity: isVisible ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className={`
          w-full max-w-screen-lg rounded-full border border-[var(--color-border)] 
          backdrop-blur-md transition-all duration-300 
          ${isScrolled ? "bg-background/80 shadow-lg" : "bg-background/50"}
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
                            <button
                                type="button"
                                onClick={toggleUserMenu}
                                className="flex items-center gap-2 rounded-full px-3 py-2 text-[var(--color-foreground)] hover:bg-[var(--heart-blue-500)/10]"
                                aria-expanded={userMenuOpen}
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--heart-blue-500)] text-white">
                                    <span className="text-sm font-medium">
                                        {user?.first_name?.charAt(0)}
                                        {user?.last_name?.charAt(0)}
                                    </span>
                                </div>
                                <span className="hidden font-medium sm:inline-block">{user?.first_name}</span>
                            </button>
                            
                            {userMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute right-0 mt-2 w-60 rounded-lg border border-[var(--color-border)] bg-background/95 p-3 shadow-lg backdrop-blur-md"
                                >
                                    <div className="mb-3 border-b border-[var(--color-border)] pb-3">
                                        <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Link 
                                            href="/profile"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--heart-blue-500)/10]"
                                        >
                                            <RiUser3Line className="h-4 w-4 text-[var(--heart-blue-500)]" />
                                            <span>Profile</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--heart-blue-500)/10] text-left"
                                        >
                                            <RiLogoutBoxRLine className="h-4 w-4 text-[var(--heart-blue-500)]" />
                                            <span>Log out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ) : !isAuthPage && (
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
                    )}
                    <ThemeToggle />
                </div>

                {/* Mobile Navigation Button */}
                <div className="flex items-center gap-2 md:hidden">
                    {/* User profile button for mobile */}
                    {!loading && isAuthenticated && (
                        <button
                            onClick={toggleUserMenu}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--heart-blue-500)] text-white"
                        >
                            <span className="text-sm font-medium">
                                {user?.first_name?.charAt(0)}
                                {user?.last_name?.charAt(0)}
                            </span>
                        </button>
                    )}
                    
                    <ThemeToggle />
                    <button
                        onClick={toggleMobileMenu}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]"
                        aria-label="Toggle menu"
                    >
                        <div className="relative h-5 w-5">
                            <motion.span
                                animate={isMobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                                className="absolute left-0 top-0 h-0.5 w-5 bg-current"
                            />
                            <motion.span
                                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                                className="absolute left-0 top-2 h-0.5 w-5 bg-current"
                            />
                            <motion.span
                                animate={isMobileMenuOpen ? { rotate: -45, y: 4 } : { rotate: 0, y: 8 }}
                                className="absolute left-0 top-0 h-0.5 w-5 bg-current"
                            />
                        </div>
                    </button>
                </div>
            </motion.div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-[var(--color-border)] bg-background/95 p-4 backdrop-blur-md shadow-lg mx-4"
                >
                    <div className="flex flex-col space-y-3">
                        <MobileNavItem href="/chat" icon={<RiMessage3Line className="h-5 w-5" />} label="Chat" />
                        
                        {/* Authentication links for mobile */}
                        {!loading && !isAuthenticated && !isAuthPage && (
                            <>
                                <MobileNavItem href="/login" icon={<RiUser3Line className="h-5 w-5" />} label="Log in" />
                                <MobileNavItem href="/register" icon={<RiUser3Line className="h-5 w-5" />} label="Register" />
                            </>
                        )}
                        
                        {!loading && isAuthenticated && (
                            <>
                                <MobileNavItem href="/profile" icon={<RiUser3Line className="h-5 w-5" />} label="Profile" />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--heart-blue-500)/10] text-left w-full"
                                >
                                    <span className="text-[var(--heart-blue-500)]"><RiLogoutBoxRLine className="h-5 w-5" /></span>
                                    <span className="font-medium">Log out</span>
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
            
            {/* Mobile User Menu Dropdown */}
            {userMenuOpen && !isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-lg border border-[var(--color-border)] bg-background/95 p-4 backdrop-blur-md shadow-lg mx-4"
                >
                    <div className="mb-3 border-b border-[var(--color-border)] pb-3">
                        <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <MobileNavItem href="/profile" icon={<RiUser3Line className="h-5 w-5" />} label="Profile" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--heart-blue-500)/10] text-left w-full"
                        >
                            <span className="text-[var(--heart-blue-500)]"><RiLogoutBoxRLine className="h-5 w-5" /></span>
                            <span className="font-medium">Log out</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/**
 * Navigation item for desktop view
 */
function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-2 rounded-full px-4 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--heart-blue-500)/10]"
        >
            <span className="text-[var(--heart-blue-500)] group-hover:text-[var(--heart-blue-700)]">
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}

/**
 * Navigation item for mobile dropdown
 */
function MobileNavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--heart-blue-500)/10]"
        >
            <span className="text-[var(--heart-blue-500)]">{icon}</span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}