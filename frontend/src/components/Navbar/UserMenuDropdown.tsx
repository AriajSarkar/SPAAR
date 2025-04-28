import Link from 'next/link';
import { motion } from 'motion/react';
import { RiUser3Line, RiLogoutBoxRLine } from '@remixicon/react';

interface UserMenuDropdownProps {
    user: {
        first_name?: string;
        last_name?: string;
        email?: string;
    } | null;
    onClose: () => void;
    onLogout: () => Promise<void>;
}

/**
 * Dropdown menu for user profile on desktop view
 */
export function UserMenuDropdown({ user, onClose, onLogout }: UserMenuDropdownProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-60 rounded-lg border border-[var(--color-border)] bg-background/95 p-3 shadow-lg backdrop-blur-md"
        >
            <div className="mb-3 border-b border-[var(--color-border)] pb-3">
                <p className="font-medium">
                    {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="space-y-1">
                <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--heart-blue-500)/10]"
                >
                    <RiUser3Line className="h-4 w-4 text-[var(--heart-blue-500)]" />
                    <span>Profile</span>
                </Link>
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--heart-blue-500)/10] text-left"
                >
                    <RiLogoutBoxRLine className="h-4 w-4 text-[var(--heart-blue-500)]" />
                    <span>Log out</span>
                </button>
            </div>
        </motion.div>
    );
}