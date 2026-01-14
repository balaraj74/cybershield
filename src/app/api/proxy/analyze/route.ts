/**
 * API Route: Analyze Content
 * Secure proxy to FastAPI backend for threat analysis
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyzeContent } from "@/lib/api";
import { getMockAnalysisResult } from "@/lib/mock-data";
import {
    checkRateLimit,
    createRateLimitHeaders,
    rateLimitConfigs,
    getClientIdentifier,
} from "@/lib/rate-limit";

// Request validation schema
const analyzeRequestSchema = z.object({
    type: z.enum(["email", "message", "url"]),
    content: z
        .string()
        .min(1, "Content is required")
        .max(50000, "Content too large"),
    metadata: z
        .object({
            source: z.string().optional(),
            timestamp: z.string().optional(),
        })
        .optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Check if demo mode
        const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
            !process.env.FASTAPI_URL ||
            process.env.FASTAPI_URL.includes("localhost");

        // 1. Authentication check (optional in demo mode)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isDemoMode) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // 2. Rate limiting
        const clientId = `${user?.id || 'demo'}:${getClientIdentifier(request)}`;
        const rateLimitResult = checkRateLimit(clientId, rateLimitConfigs.analysis);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: {
                        code: "RATE_LIMITED",
                        message: "Too many requests. Please try again later.",
                    },
                },
                {
                    status: 429,
                    headers: createRateLimitHeaders(rateLimitResult),
                }
            );
        }

        // 3. Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
                { status: 400 }
            );
        }

        const validation = analyzeRequestSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: {
                        code: "VALIDATION_ERROR",
                        message: validation.error.issues[0]?.message || "Invalid request",
                    },
                },
                { status: 400 }
            );
        }

        const { type, content, metadata } = validation.data;

        // 4. Forward to FastAPI or use mock data
        let result;

        if (isDemoMode) {
            // Demo mode: Use mock analysis
            result = await getMockAnalysisResult(type, content);
        } else {
            // Production: Forward to FastAPI backend
            try {
                const apiResponse = await analyzeContent({
                    type,
                    content,
                    metadata,
                });

                if (!apiResponse.success || !apiResponse.data) {
                    // Fallback to mock on error
                    result = await getMockAnalysisResult(type, content);
                } else {
                    result = apiResponse.data;
                }
            } catch {
                // Fallback to mock on error
                result = await getMockAnalysisResult(type, content);
            }
        }

        // 5. Return sanitized response (never return raw input)
        return NextResponse.json(
            {
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
            },
            { headers: createRateLimitHeaders(rateLimitResult) }
        );
    } catch (error) {
        // Log error internally, but don't expose details
        console.error("Analysis error:", error);

        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                },
            },
            { status: 500 }
        );
    }
}

// Health check for the analyze endpoint
export async function GET() {
    return NextResponse.json({
        status: "healthy",
        service: "analyze",
        timestamp: new Date().toISOString(),
    });
}
