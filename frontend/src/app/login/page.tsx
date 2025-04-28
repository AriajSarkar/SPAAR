'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login: authLogin } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await login(formData);

            if (!response.success) {
                setError(response.message || 'Invalid email or password');
                return;
            }

            // Use AuthContext to manage authentication state
            if (response.tokens && response.user) {
                authLogin(response.tokens, response.user);
            }

            // Redirect to chat page after successful login
            router.push('/chat');
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-6 bg-card shadow-lg">
                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
                        <p className="text-sm text-muted-foreground mt-1">Log in to continue with your account</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="bg-background"
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </label>
                                <Link href="#" className="text-xs text-[color:var(--heart-blue-500)] hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="bg-background"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading} variant="default">
                            {loading ? 'Logging in...' : 'Log in'}
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-[color:var(--heart-blue-500)] hover:underline">
                            Sign up
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}
