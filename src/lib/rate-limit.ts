/**
 * Rate limiting implementation for API routes
 * Uses in-memory storage (replace with Redis for production)
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// In-memory store for rate limiting
// Note: In production, use Redis or similar for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
    lastCleanup = now;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    cleanupExpiredEntries();

    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    const entry = rateLimitStore.get(key);

    // No existing entry or expired entry
    if (!entry || entry.resetAt < now) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + config.windowMs,
        };
        rateLimitStore.set(key, newEntry);

        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetAt: newEntry.resetAt,
        };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetAt: entry.resetAt,
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
    }

    // Increment counter
    entry.count += 1;
    rateLimitStore.set(key, entry);

    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
    const headers = new Headers();
    headers.set("X-RateLimit-Remaining", String(result.remaining));
    headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

    if (!result.success && result.retryAfter) {
        headers.set("Retry-After", String(result.retryAfter));
    }

    return headers;
}

/**
 * Default rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
    api: {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
    },
    analysis: {
        maxRequests: 20,
        windowMs: 60000, // 1 minute
    },
    auth: {
        maxRequests: 10,
        windowMs: 60000, // 1 minute
    },
} as const;

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from various headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }

    // Fallback - in production, you'd want a more reliable method
    return "unknown-client";
}
