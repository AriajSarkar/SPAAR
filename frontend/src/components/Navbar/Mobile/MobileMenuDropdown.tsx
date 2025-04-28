import { motion } from 'motion/react';
import { RiMessage3Line, RiUser3Line, RiLogoutBoxRLine } from '@remixicon/react';
import { MobileNavItem } from './MobileNavItem';

interface MobileMenuDropdownProps {
    isAuthenticated: boolean;
    isAuthPage: boolean;
    loading: boolean;
    onLogout: () => Promise<void>;
}

/**
 * Mobile dropdown menu with navigation links
 */
export function MobileMenuDropdown({ isAuthenticated, isAuthPage, loading, onLogout }: MobileMenuDropdownProps) {
    return (
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
                        <MobileNavItem
                            href="/login"
                            icon={<RiUser3Line className="h-5 w-5" />}
                            label="Log in"
                        />
                        <MobileNavItem
                            href="/register"
                            icon={<RiUser3Line className="h-5 w-5" />}
                            label="Register"
                        />
                    </>
                )}

                {!loading && isAuthenticated && (
                    <>
                        <MobileNavItem
                            href="/profile"
                            icon={<RiUser3Line className="h-5 w-5" />}
                            label="Profile"
                        />
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--heart-blue-500)/10] text-left w-full"
                        >
                            <span className="text-[var(--heart-blue-500)]">
                                <RiLogoutBoxRLine className="h-5 w-5" />
                            </span>
                            <span className="font-medium">Log out</span>
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
}