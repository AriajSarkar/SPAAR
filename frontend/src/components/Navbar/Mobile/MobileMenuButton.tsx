import { motion } from 'motion/react';

interface MobileMenuButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

/**
 * Hamburger button for toggling mobile menu with animation
 */
export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]"
            aria-label="Toggle menu"
        >
            <div className="relative h-5 w-5">
                <motion.span
                    animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                    className="absolute left-0 top-0 h-0.5 w-5 bg-current"
                />
                <motion.span
                    animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                    className="absolute left-0 top-2 h-0.5 w-5 bg-current"
                />
                <motion.span
                    animate={isOpen ? { rotate: -45, y: 4 } : { rotate: 0, y: 8 }}
                    className="absolute left-0 top-0 h-0.5 w-5 bg-current"
                />
            </div>
        </button>
    );
}