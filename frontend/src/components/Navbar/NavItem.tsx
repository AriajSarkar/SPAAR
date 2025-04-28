import Link from 'next/link';
import React from 'react';

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
}

/**
 * Navigation item for desktop view
 */
export function NavItem({ href, icon, label }: NavItemProps) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-2 rounded-full px-4 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--heart-blue-500)/10]"
        >
            <span className="text-[var(--heart-blue-500)] group-hover:text-[var(--heart-blue-700)]">{icon}</span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}