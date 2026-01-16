/**
 * API Route: Analyze Content
 * Uses Google Gemini 2.5 Flash for real-time AI threat analysis
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyzeWithGemini } from "@/lib/gemini";
import {
    checkRateLimit,
    createRateLimitHeaders,
    rateLimitConfigs,
    getClientIdentifier,
} from "@/lib/rate-limit";
import crypto from "crypto";

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
    const startTime = Date.now();

    try {
        const supabase = await createClient();

        // Get user
        const { data: { user } } = await supabase.auth.getUser();

        // Rate limiting
        const clientId = `${user?.id || 'anon'}:${getClientIdentifier(request)}`;
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

        // Parse and validate request body
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

        const { type, content } = validation.data;

        // Generate hash for privacy (never store raw content)
        const inputHash = crypto.createHash("sha256")
            .update(content + Date.now().toString())
            .digest("hex")
            .substring(0, 16);

        // Use Gemini API for real AI analysis
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return NextResponse.json(
                { error: { code: "CONFIG_ERROR", message: "AI service not configured" } },
                { status: 503 }
            );
        }

        console.log(`[Gemini Analysis] Starting analysis for ${type}...`);
        const analysisResult = await analyzeWithGemini(type, content, geminiApiKey);
        console.log(`[Gemini Analysis] Complete: ${analysisResult.threatType} (${analysisResult.riskScore}%)`);

        const processingTime = Date.now() - startTime;

        // Save to Supabase
        const { data: savedAnalysis, error: saveError } = await supabase
            .from("threat_analyses")
            .insert({
                input_hash: inputHash,
                input_type: type,
                threat_type: analysisResult.threatType,
                severity: analysisResult.severity,
                risk_score: analysisResult.riskScore,
                confidence: analysisResult.confidence,
                summary: analysisResult.summary,
                explanation: JSON.stringify(analysisResult.explanation),
                indicators: JSON.stringify(analysisResult.indicators),
                recommendations: JSON.stringify(analysisResult.recommendations),
                risk_contributions: JSON.stringify(analysisResult.riskContributions),
                processing_time_ms: processingTime,
                model_version: "gemini-2.5-flash",
                analyzed_by: user?.id || null
            })
            .select()
            .single();

        if (saveError) {
            console.error("Failed to save analysis:", saveError);
            // Continue even if save fails - still return the result
        }

        // Return analysis result
        return NextResponse.json(
            {
                success: true,
                data: {
                    id: savedAnalysis?.id || inputHash,
                    inputHash,
                    inputType: type,
                    threatType: analysisResult.threatType,
                    severity: analysisResult.severity,
                    riskScore: analysisResult.riskScore,
                    confidence: analysisResult.confidence,
                    summary: analysisResult.summary,
                    explanation: analysisResult.explanation,
                    indicators: analysisResult.indicators,
                    recommendations: analysisResult.recommendations,
                    riskContributions: analysisResult.riskContributions,
                    analyzedAt: new Date().toISOString(),
                    processingTimeMs: processingTime,
                    modelVersion: "gemini-2.5-flash"
                },
                timestamp: new Date().toISOString(),
            },
            { headers: createRateLimitHeaders(rateLimitResult) }
        );
    } catch (error) {
        console.error("Analysis error:", error);
        return NextResponse.json(
            {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "An unexpected error occurred during analysis",
                },
            },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    const geminiConfigured = !!process.env.GEMINI_API_KEY;

    return NextResponse.json({
        status: geminiConfigured ? "healthy" : "degraded",
        service: "analyze",
        aiEngine: geminiConfigured ? "gemini-2.5-flash" : "not configured",
        timestamp: new Date().toISOString(),
    });
}
