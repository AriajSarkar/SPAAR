'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiWifiLine, RiWifiOffLine } from '@remixicon/react';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
    /**
     * Milliseconds to show positive status messages before hiding
     */
    autoDismissTime?: number;
    /**
     * Position of the notification
     */
    position?: 'top' | 'bottom';
    /**
     * Z-index of the notification
     */
    zIndex?: number;
}

/**
 * NetworkStatus component monitors connection status and shows an elegant notification
 * when the user's internet connection is lost or restored
 */
export function NetworkStatus({ autoDismissTime = 3000, position = 'top', zIndex = 50 }: NetworkStatusProps) {
    const [isOnline, setIsOnline] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [icon, setIcon] = useState<'online' | 'offline'>('online');

    // Monitor network status
    useEffect(() => {
        // Initialize with current status
        setIsOnline(navigator.onLine);

        // Online status handler
        const handleOnline = () => {
            setIsOnline(true);
            setMessage('You are back online');
            setIcon('online');
            setIsVisible(true);

            // Auto-dismiss positive messages
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, autoDismissTime);

            return () => clearTimeout(timer);
        };

        // Offline status handler
        const handleOffline = () => {
            setIsOnline(false);
            setMessage('Connection lost. Check your internet connection.');
            setIcon('offline');
            setIsVisible(true);
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [autoDismissTime]);

    // Position styles
    const positionClasses = position === 'top' ? 'top-0 inset-x-0 pt-1 sm:pt-2' : 'bottom-0 inset-x-0 pb-1 sm:pb-2';

    return (
        <AnimatePresence>
            {isVisible && (
                <div
                    className={cn('fixed flex justify-center pointer-events-none', positionClasses)}
                    style={{ zIndex }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: position === 'top' ? -10 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: position === 'top' ? -10 : 10 }}
                        transition={{ duration: 0.2 }}
                        className="pointer-events-auto mx-auto"
                    >
                        <div
                            className={cn(
                                'flex items-center px-3 py-2 rounded-lg shadow-lg',
                                'border text-sm',
                                isOnline
                                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-300'
                                    : 'bg-destructive/10 border-destructive/30 text-destructive',
                            )}
                        >
                            <div className="flex items-center justify-center mr-2">
                                {icon === 'online' ? (
                                    <RiWifiLine className="h-4 w-4" />
                                ) : (
                                    <RiWifiOffLine className="h-4 w-4" />
                                )}
                            </div>
                            <span>{message}</span>

                            {!isOnline && (
                                <button
                                    className="ml-3 underline text-xs opacity-80 hover:opacity-100 pointer-events-auto"
                                    onClick={() => setIsVisible(false)}
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
