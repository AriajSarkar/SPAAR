import Link from 'next/link';
import React from 'react';

interface MobileNavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
}

/**
 * Navigation item for mobile dropdown
 */
export function MobileNavItem({ href, icon, label }: MobileNavItemProps) {
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
