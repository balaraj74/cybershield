/**
 * API Route: Analysis History
 * Fetches real data from Supabase
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
        const severity = searchParams.get("severity") || undefined;
        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from("threat_analyses")
            .select("*", { count: "exact" })
            .order("analyzed_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by severity if specified
        if (severity && severity !== "all") {
            query = query.eq("severity", severity);
        }

        const { data: analyses, error, count } = await query;

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({
                success: false,
                error: { code: "FETCH_FAILED", message: "Unable to fetch history" }
            }, { status: 503 });
        }

        // Transform data to match frontend expectations
        const items = (analyses || []).map(a => ({
            id: a.id,
            inputHash: a.input_hash,
            inputType: a.input_type,
            threatType: a.threat_type,
            severity: a.severity,
            riskScore: a.risk_score,
            confidence: a.confidence,
            summary: a.summary,
            analyzedAt: a.analyzed_at,
            processingTimeMs: a.processing_time_ms,
            isFalsePositive: a.is_false_positive
        }));

        return NextResponse.json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("History fetch error:", error);
        return NextResponse.json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" }
        }, { status: 500 });
    }
}
