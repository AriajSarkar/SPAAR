/**
 * Animation utilities for tooltips
 */
import { SpringConfigMap } from '../types';

/**
 * Spring configurations for different animation styles
 */
export const springConfigs: SpringConfigMap = {
    spring: { damping: 25, stiffness: 300 },
    smooth: { damping: 50, stiffness: 100 },
    delayed: { damping: 30, stiffness: 200 },
    elastic: { damping: 10, stiffness: 400 },
};

/**
 * Get animation variants based on position and origin
 */
export const getAnimationVariants = (
    cursorMode: boolean,
    originCoords: { x: number; y: number },
    coords: { x: number; y: number },
) => {
    return {
        hidden: {
            opacity: 0,
            scale: 0.8,
            x: cursorMode ? undefined : originCoords.x - coords.x,
            y: cursorMode ? undefined : originCoords.y - coords.y,
        },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            transition: {
                type: 'spring',
                damping: 20,
                stiffness: 300,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            x: cursorMode ? undefined : (originCoords.x - coords.x) / 2,
            y: cursorMode ? undefined : (originCoords.y - coords.y) / 2,
            transition: {
                duration: 0.15,
            },
        },
    };
};
