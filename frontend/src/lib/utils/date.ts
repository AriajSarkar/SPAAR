/**
 * Format a date into a relative time string (e.g., "2 minutes ago", "Yesterday", etc.)
 * @param date The date to format
 * @returns A human-readable relative time string
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  // Check if the date is invalid
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  // Same day
  if (d.toDateString() === now.toDateString()) {
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Within the last week
  if (diffDay < 7) {
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  }

  // More than a week ago
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };

  // If different year, include the year
  if (d.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }

  return d.toLocaleDateString(undefined, options);
}