/**
 * Middleware for Supabase Auth and Security Headers
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Define Content Security Policy
const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "connect-src": [
        "'self'",
        process.env.FASTAPI_URL || "http://localhost:8001",
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://*.supabase.co",
        "https://*.supabase.co",
    ],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
};

function buildCSP(): string {
    return Object.entries(cspDirectives)
        .map(([key, values]) => `${key} ${values.join(" ")}`)
        .join("; ");
}

export async function middleware(request: NextRequest) {
    // Update Supabase session
    const response = await updateSession(request);

    // Add security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Content-Security-Policy", buildCSP());

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|public/).*)",
    ],
};
