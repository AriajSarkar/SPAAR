import { motion } from 'motion/react';
import { RiUser3Line, RiLogoutBoxRLine } from '@remixicon/react';
import { MobileNavItem } from './MobileNavItem';

interface MobileUserMenuProps {
    user: {
        first_name?: string;
        last_name?: string;
        email?: string;
    } | null;
    onLogout: () => Promise<void>;
}

/**
 * Mobile version of the user menu dropdown
 */
export function MobileUserMenu({ user, onLogout }: MobileUserMenuProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-lg border border-[var(--color-border)] bg-background/95 p-4 backdrop-blur-md shadow-lg mx-4"
        >
            <div className="mb-3 border-b border-[var(--color-border)] pb-3">
                <p className="font-medium">
                    {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="flex flex-col space-y-3">
                <MobileNavItem href="/profile" icon={<RiUser3Line className="h-5 w-5" />} label="Profile" />
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--heart-blue-500)/10] text-left w-full"
                >
                    <span className="text-[var(--heart-blue-500)]">
                        <RiLogoutBoxRLine className="h-5 w-5" />
                    </span>
                    <span className="font-medium">Log out</span>
                </button>
            </div>
        </motion.div>
    );
}