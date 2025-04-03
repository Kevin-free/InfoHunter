import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | null | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;

  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

interface QualityReport {
  score: number;
  reason: string;
  processed_at: number;
}

export function getQualityBadgeProps(score: number | null) {
  if (score === null) {
    return {
      score: 0.0,
      variant: 'nodata' as const,
      label: 'No Data'
    };
  }

  if (score === 0) {
    return {
      score: 0,
      variant: 'outline' as const,
      label: 'No Data'
    };
  }

  if (score >= 8) {
    return {
      score: score,
      variant: 'default' as const,
      label: 'Excellent'
    };
  } else if (score >= 6) {
    return {
      score: score,
      variant: 'secondary' as const,
      label: 'Good'
    };
  } else {
    return {
      score: score,
      variant: 'destructive' as const,
      label: 'Bad'
    };
  }
}

export const getIsAdmin = (email: string) => {
  let isAdmin = false;
  if (email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    isAdmin = true;
  }
  return isAdmin;
};

/**
 * Universal time formatter for both Date objects and timestamp numbers
 * @param time Date object, ISO string date, or Unix timestamp (seconds)
 * @returns Formatted time string
 */
export function formatUniversalTime(
  time: Date | number | string | null | undefined
): string {
  if (!time) return 'None';

  // Convert to milliseconds timestamp
  let timeMs: number;
  if (time instanceof Date) {
    timeMs = time.getTime();
  } else if (typeof time === 'string') {
    // Check if the string is a numeric timestamp (digits only)
    if (/^\d+$/.test(time)) {
      timeMs = parseInt(time, 10) * 1000; // Numeric string - treat as seconds timestamp
    } else {
      timeMs = new Date(time).getTime(); // ISO date string
    }
  } else {
    timeMs = time * 1000; // Convert from seconds to milliseconds
  }

  const now = Date.now();
  const diffMs = now - timeMs;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  // Less than 24 hours ago: show relative time
  if (diffHours < 24) {
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }

  // More than 24 hours ago: show date
  const date = new Date(timeMs);
  return date.toLocaleDateString();
}

/**
 * Get color based on freshness for any time type
 * @param time Date object, ISO string date, or Unix timestamp (seconds)
 * @returns CSS class for text color
 */
export function getTimeFreshnessColor(
  time: Date | number | string | null | undefined
): string {
  if (!time) return 'text-gray-400'; // No time data

  // Convert to milliseconds timestamp
  let timeMs: number;
  if (time instanceof Date) {
    timeMs = time.getTime();
  } else if (typeof time === 'string') {
    // Check if the string is a numeric timestamp (digits only)
    if (/^\d+$/.test(time)) {
      timeMs = parseInt(time, 10) * 1000; // Numeric string - treat as seconds timestamp
    } else {
      timeMs = new Date(time).getTime(); // ISO date string
    }
  } else {
    timeMs = time * 1000; // Convert from seconds to milliseconds
  }

  const now = Date.now();
  const diffMs = now - timeMs;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Fresh: less than 6 hours
  if (diffHours < 6) {
    return 'text-green-500';
  }

  // Not that fresh: between 6 and 24 hours
  if (diffHours < 24) {
    return 'text-yellow-500';
  }

  // Stale: more than 24 hours
  return 'text-red-500';
}
