'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RiErrorWarningLine, RiRefreshLine } from '@remixicon/react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree
 * Prevents the entire application from crashing when an error occurs in a component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    resetErrorBoundary = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950 text-white">
                    <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <RiErrorWarningLine className="h-8 w-8 text-red-500" />
                            <h1 className="text-xl font-semibold">Something went wrong</h1>
                        </div>

                        <div className="mb-6 p-3 bg-gray-800 rounded overflow-auto max-h-[200px]">
                            <p className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                {this.state.error?.message || 'An unknown error occurred'}
                            </p>
                        </div>

                        <Button
                            onClick={() => {
                                this.resetErrorBoundary();
                                window.location.reload();
                            }}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <RiRefreshLine className="h-4 w-4" />
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
