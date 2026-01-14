/**
 * API Route: Analyze Content
 * Secure proxy to FastAPI backend for threat analysis
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { analyzeContent } from "@/lib/api";
import { getMockAnalysisResult } from "@/lib/mock-data";
import {
    checkRateLimit,
    createRateLimitHeaders,
    rateLimitConfigs,
    getClientIdentifier,
} from "@/lib/rate-limit";
import { env } from "@/env";

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
        // 1. Authentication check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // 2. Rate limiting
        const clientId = `${session.user.id}:${getClientIdentifier(request)}`;
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

        if (env.NEXT_PUBLIC_DEMO_MODE) {
            // Demo mode: Use mock analysis
            result = await getMockAnalysisResult(type, content);
        } else {
            // Production: Forward to FastAPI backend
            const apiResponse = await analyzeContent({
                type,
                content,
                metadata,
            });

            if (!apiResponse.success || !apiResponse.data) {
                return NextResponse.json(
                    {
                        error: apiResponse.error || {
                            code: "ANALYSIS_FAILED",
                            message: "Analysis service unavailable",
                        },
                    },
                    { status: 503 }
                );
            }

            result = apiResponse.data;
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
