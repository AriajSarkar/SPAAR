"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LoginRequiredProps {
  message?: string;
}

/**
 * A component that displays when a user needs to log in to access protected content
 */
export const LoginRequired = ({ 
  message = "You need to log in to access this feature."
}: LoginRequiredProps) => {
  return (
    <Card className="p-6 bg-card shadow-md border border-gray-800 max-w-md w-full">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-[color:var(--heart-blue-500)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1656 17.2554 20.3765 17.7644 20.3765 18.295C20.3765 18.8256 20.1656 19.3346 19.79 19.71C19.4144 20.0856 18.9055 20.2964 18.375 20.2964C17.8445 20.2964 17.3356 20.0856 16.96 19.71L16.9 19.65C16.4178 19.1783 15.6971 19.0477 15.08 19.32C14.4791 19.5791 14.0936 20.1724 14.09 20.83V21C14.09 22.1046 13.1946 23 12.09 23C10.9854 23 10.09 22.1046 10.09 21V20.91C10.0746 20.2376 9.66648 19.6346 9.04 19.39C8.42291 19.1177 7.70216 19.2483 7.22 19.72L7.16 19.78C6.78439 20.1556 6.27542 20.3664 5.745 20.3664C5.21457 20.3664 4.70561 20.1556 4.33 19.78C3.95444 19.4044 3.74358 18.8955 3.74358 18.365C3.74358 17.8345 3.95444 17.3256 4.33 16.95L4.39 16.89C4.86167 16.4078 4.99231 15.6871 4.72 15.07C4.46092 14.4691 3.86762 14.0836 3.21 14.08H3C1.89543 14.08 1 13.1846 1 12.08C1 10.9754 1.89543 10.08 3 10.08H3.09C3.76237 10.0646 4.36539 9.65648 4.61 9.03C4.88228 8.41291 4.75164 7.69217 4.28 7.21L4.22 7.15C3.84444 6.77439 3.63359 6.26543 3.63359 5.735C3.63359 5.20457 3.84444 4.69561 4.22 4.32C4.59561 3.94444 5.10457 3.73359 5.635 3.73359C6.16543 3.73359 6.67439 3.94444 7.05 4.32L7.11 4.38C7.59217 4.85164 8.31292 4.98228 8.93 4.71H9C9.60093 4.45092 9.98638 3.85762 9.99 3.2V3C9.99 1.89543 10.8854 1 11.99 1C13.0946 1 13.99 1.89543 13.99 3V3.09C13.9936 3.74762 14.3791 4.34096 14.98 4.6C15.5971 4.87228 16.3178 4.74164 16.8 4.27L16.86 4.21C17.2356 3.83444 17.7446 3.62359 18.275 3.62359C18.8055 3.62359 19.3144 3.83444 19.69 4.21C20.0656 4.58561 20.2764 5.09457 20.2764 5.625C20.2764 6.15543 20.0656 6.66439 19.69 7.04L19.63 7.1C19.1583 7.58217 19.0277 8.30292 19.3 8.92V9C19.5591 9.60093 20.1524 9.98638 20.81 10H21C22.1046 10 23 10.8954 23 12C23 13.1046 22.1046 14 21 14H20.91C20.2524 14.0036 19.6591 14.3891 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="text-lg font-medium text-white">{message}</h2>
        
        <p className="text-sm text-gray-400">
          Please log in to your account to continue using this feature.
        </p>
        
        <div className="flex gap-3 pt-2">
          <Button asChild variant="outline" className="border-gray-700">
            <Link href="/register">
              Sign Up
            </Link>
          </Button>
          
          <Button asChild>
            <Link href="/login">
              Log In
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};