"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  /**
   * Size of the spinner
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /**
   * Spinner color variant matching heart theme
   */
  variant?: 'blue' | 'cyan' | 'default';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Spinner component for indicating loading states
 * Styled according to the heart-themed brand guidelines
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
}) => {
  // Map size to dimensions
  const sizeMap = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  // Map variant to color
  const variantMap = {
    blue: 'text-[color:var(--heart-blue-500)]',
    cyan: 'text-[color:var(--heart-cyan-500)]',
    default: 'text-foreground/60',
  };

  return (
    <div role="status" className={cn('inline-block', className)}>
      <svg
        className={cn(
          'animate-spin',
          sizeMap[size],
          variantMap[variant],
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading..."
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="sr-only">Loading</span>
    </div>
  );
};