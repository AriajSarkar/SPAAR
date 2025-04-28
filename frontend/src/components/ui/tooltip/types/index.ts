/**
 * Type definitions for the tooltip component system
 */

import React from "react";

/**
 * Props for FloatingTooltip component
 */
export interface FloatingTooltipProps {
  /** Content to display in the tooltip */
  content: React.ReactNode;
  /** Position of tooltip relative to target element */
  position?: "top" | "right" | "bottom" | "left" | "top-right" | "top-left";
  /** Children to wrap with tooltip functionality */
  children: React.ReactNode;
  /** Optional CSS class name */
  className?: string;
  /** Whether to show an arrow pointing to the target */
  showArrow?: boolean;
  /** Delay before showing tooltip in ms (default: 100) */
  delayShow?: number;
  /** Delay before hiding tooltip in ms (default: 100) */
  delayHide?: number;
  /** Custom offset from target element in pixels */
  offset?: number;
  /** Background color override */
  backgroundColor?: string;
  /** Text color override */
  textColor?: string;
  /** Border color override */
  borderColor?: string;
  /** Enable tooltip cursor-like behavior */
  cursorMode?: boolean;
  /** Animation style for the tooltip cursor */
  cursorAnimation?: "spring" | "smooth" | "delayed" | "elastic";
}

/**
 * Props for the useFloatingTooltip hook
 */
export interface UseFloatingTooltipProps extends Omit<FloatingTooltipProps, 'children' | 'content'> {
  /** Content to display in the tooltip (optional) */
  content?: React.ReactNode;
  /** Whether to integrate with custom cursor component */
  integrateCursor?: boolean;
  /** Whether the tooltip should behave like a cursor */
  cursorMode?: boolean;
  /** Animation style for the tooltip cursor */
  cursorAnimation?: "spring" | "smooth" | "delayed" | "elastic";
}

/**
 * Spring configuration types for animation
 */
export type SpringConfigMap = {
  spring: { damping: number; stiffness: number };
  smooth: { damping: number; stiffness: number };
  delayed: { damping: number; stiffness: number };
  elastic: { damping: number; stiffness: number };
};