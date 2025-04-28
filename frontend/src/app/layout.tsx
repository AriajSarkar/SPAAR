import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { CursorProvider } from '@/components/ui/cursor/useCursorState';
import { StatefulCursor } from '@/components/ui/cursor/StatefulCursor';
import { AuthProvider } from '@/lib/auth/AuthContext';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Heart Chat - AI Powered Chatbot',
    description: 'Modern chatbot interface integrating with n8n for AI-powered conversations',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ThemeProvider>
                    <CursorProvider>
                        <AuthProvider>
                            <StatefulCursor follow={true} color="var(--heart-blue-500)" />
                            {children}
                        </AuthProvider>
                    </CursorProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
