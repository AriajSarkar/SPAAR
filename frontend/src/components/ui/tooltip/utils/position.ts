/**
 * Position calculation utilities for tooltips
 */

/**
 * Calculate tooltip position based on target element and desired position
 */
export const calculateTooltipPosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  position: string,
  offset: number
): { x: number, y: number } => {
  let x = 0;
  let y = 0;

  // Calculate position based on specified position prop
  switch (position) {
    case "top":
      x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      y = triggerRect.top - tooltipRect.height - offset;
      break;
    case "top-right":
      x = triggerRect.right - tooltipRect.width;
      y = triggerRect.top - tooltipRect.height - offset;
      break;
    case "top-left":
      x = triggerRect.left;
      y = triggerRect.top - tooltipRect.height - offset;
      break;
    case "right":
      x = triggerRect.right + offset;
      y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      break;
    case "bottom":
      x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      y = triggerRect.bottom + offset;
      break;
    case "left":
      x = triggerRect.left - tooltipRect.width - offset;
      y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      break;
    default:
      x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      y = triggerRect.top - tooltipRect.height - offset;
  }

  // Keep tooltip within viewport bounds
  x = Math.max(10, Math.min(x, window.innerWidth - tooltipRect.width - 10));
  y = Math.max(10, Math.min(y, window.innerHeight - tooltipRect.height - 10));
  
  return { x, y };
};

/**
 * Get arrow styles based on position
 */
export const getArrowStyles = (
  position: string,
  arrowSize: number = 6,
  borderColor?: string,
  backgroundColor?: string
): React.CSSProperties => {
  const styles: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeft: `${arrowSize}px solid transparent`,
    borderRight: `${arrowSize}px solid transparent`,
    borderTop: `${arrowSize}px solid ${borderColor || backgroundColor || "var(--background)"}`,
    borderBottom: 0,
    filter: "drop-shadow(0 -1px 0px var(--color-border))",
  };

  if (position.includes("top")) {
    return {
      ...styles,
      bottom: -arrowSize,
      left: "50%",
      transform: "translateX(-50%)",
    };
  } else if (position === "bottom") {
    return {
      ...styles,
      top: -arrowSize,
      left: "50%",
      transform: "translateX(-50%) rotate(180deg)",
    };
  } else if (position === "left") {
    return {
      ...styles,
      right: -arrowSize,
      top: "50%",
      transform: "translateY(-50%) rotate(90deg)",
    };
  } else if (position === "right") {
    return {
      ...styles,
      left: -arrowSize,
      top: "50%",
      transform: "translateY(-50%) rotate(-90deg)",
    };
  }

  return styles;
};