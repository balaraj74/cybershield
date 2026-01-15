/**
 * Utility functions for the CyberShield platform
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generates a secure hash from input content
 * Used for referencing data without storing raw content
 */
export async function generateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Masks sensitive content for display
 */
export function maskSensitiveText(text: string, showChars: number = 4): string {
    if (text.length <= showChars * 2) {
        return "*".repeat(text.length);
    }
    return (
        text.slice(0, showChars) +
        "*".repeat(Math.max(text.length - showChars * 2, 4)) +
        text.slice(-showChars)
    );
}

/**
 * Formats a date string for display
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

/**
 * Formats a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return "—";

    const d = typeof date === "string" ? new Date(date) : date;

    // Check for invalid date
    if (isNaN(d.getTime())) return "—";

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return formatDate(d);
}

/**
 * Gets severity color classes based on severity level
 */
export function getSeverityColors(severity: string): {
    bg: string;
    text: string;
    border: string;
    glow: string;
} {
    switch (severity) {
        case "critical":
            return {
                bg: "bg-red-500/20",
                text: "text-red-400",
                border: "border-red-500/50",
                glow: "shadow-red-500/25",
            };
        case "high":
            return {
                bg: "bg-orange-500/20",
                text: "text-orange-400",
                border: "border-orange-500/50",
                glow: "shadow-orange-500/25",
            };
        case "medium":
            return {
                bg: "bg-yellow-500/20",
                text: "text-yellow-400",
                border: "border-yellow-500/50",
                glow: "shadow-yellow-500/25",
            };
        case "low":
            return {
                bg: "bg-blue-500/20",
                text: "text-blue-400",
                border: "border-blue-500/50",
                glow: "shadow-blue-500/25",
            };
        case "safe":
        default:
            return {
                bg: "bg-emerald-500/20",
                text: "text-emerald-400",
                border: "border-emerald-500/50",
                glow: "shadow-emerald-500/25",
            };
    }
}

/**
 * Truncates text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + "...";
}

/**
 * Generates a random ID for demo purposes
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Sanitizes input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
