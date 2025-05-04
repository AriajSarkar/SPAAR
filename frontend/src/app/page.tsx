'use client';

import { FloatingNavbar } from '@/components/Navbar/FloatingNavbar';
import { RiHeartFill } from '@remixicon/react';

export default function Home() {
    return (
        <>
            <FloatingNavbar />
            <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 pt-20">
                <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                    {/* HeartChat Logo/Title Section */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--heart-blue-500)] text-white">
                            <RiHeartFill size={24} />
                        </div>
                        <h1 className="text-xl font-semibold sm:text-2xl">Heart Chat</h1>
                    </div>

                    <div className="flex max-w-md flex-col gap-4 text-center sm:text-left">
                        <h2 className="text-lg font-medium sm:text-xl">Modern chatbot UI with heart-themed design</h2>
                        <p className="text-[var(--color-muted-foreground)]">
                            This project features a clean, responsive interface with dark mode support and a beautiful
                            heart-themed color palette.
                        </p>
                    </div>

                    <div className="flex gap-4 items-center flex-col sm:flex-row">
                        <CursorAwareButton
                            href="/chat"
                            label="Start Chatting"
                            primary
                            tooltipContent="Begin your heart-to-heart conversation"
                        />
                        <CursorAwareButton
                            href="/settings"
                            label="Settings"
                            tooltipContent="Customize your experience"
                        />
                    </div>
                </main>

                <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-[var(--color-muted-foreground)] text-sm">
                    <span>© 2025 Heart Chat</span>
                    <span>•</span>
                    <a className="hover:text-[var(--heart-blue-500)] transition-colors" href="#">
                        Privacy
                    </a>
                    <a className="hover:text-[var(--heart-blue-500)] transition-colors" href="#">
                        Terms
                    </a>
                    <a className="hover:text-[var(--heart-blue-500)] transition-colors" href="#">
                        About
                    </a>
                </footer>
            </div>
        </>
    );
}

/**
 * Button component that integrates with the custom cursor
 */
function CursorAwareButton({
    href,
    label,
    primary = false,
}: {
    href: string;
    label: string;
    primary?: boolean;
    tooltipContent: string;
}) {
    const buttonClassName = `rounded-full border border-solid transition-colors flex items-center justify-center font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto ${
        primary
            ? 'border-transparent bg-[var(--heart-blue-500)] text-white hover:bg-[var(--heart-blue-700)]'
            : 'border-[var(--color-border)] hover:bg-[var(--heart-cyan-500)/10] hover:border-[var(--heart-cyan-500)/50]'
    }`;

    return (
        <a href={href} className={buttonClassName}>
            {label}
        </a>
    );
}
