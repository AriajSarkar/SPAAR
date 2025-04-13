"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ThemeToggle } from "../theme/ThemeToggle";
import Link from "next/link";
import { RiRobot2Line, RiMessage3Line, RiSettings3Line } from "@remixicon/react";

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

    // Toggle mobile menu
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
                    <NavItem href="/settings" icon={<RiSettings3Line className="h-5 w-5" />} label="Settings" />
                    <ThemeToggle />
                </div>

                {/* Mobile Navigation Button */}
                <div className="flex items-center gap-2 md:hidden">
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
                        <MobileNavItem href="/settings" icon={<RiSettings3Line className="h-5 w-5" />} label="Settings" />
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