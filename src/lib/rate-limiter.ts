/**
 * Simple in-memory rate limiter for AI requests
 * Limit: 10 requests per minute per hotel
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

/**
 * Check if a hotel has exceeded rate limit
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(hotelId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(hotelId);

  // No entry yet or window expired → allow and create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(hotelId, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return true;
  }

  // Within window → check count
  if (entry.count < MAX_REQUESTS) {
    entry.count++;
    return true;
  }

  // Rate limit exceeded
  return false;
}

/**
 * Get remaining requests for a hotel (for debugging/monitoring)
 */
export function getRemainingRequests(hotelId: string): number {
  const entry = rateLimitStore.get(hotelId);
  if (!entry || Date.now() > entry.resetAt) {
    return MAX_REQUESTS;
  }
  return Math.max(0, MAX_REQUESTS - entry.count);
}

/**
 * Clean up expired entries (run periodically if needed)
 */
export function cleanupRateLimiter() {
  const now = Date.now();
  for (const [hotelId, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(hotelId);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimiter, 5 * 60 * 1000);
}
