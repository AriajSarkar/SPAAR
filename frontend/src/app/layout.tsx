import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { NetworkStatus } from '@/components/ui/NetworkStatus';

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
                    <AuthProvider>
                        {children}
                        <NetworkStatus position="top" zIndex={100} />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
