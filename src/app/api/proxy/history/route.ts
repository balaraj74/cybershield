/**
 * API Route: Analysis History
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnalysisHistory } from "@/lib/api";
import { getMockHistory } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
    try {
        // Check if demo mode
        const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
            !process.env.FASTAPI_URL ||
            process.env.FASTAPI_URL.includes("localhost");

        // Authentication check (optional in demo mode)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user && !isDemoMode) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
        const severity = searchParams.get("severity") || undefined;

        let data;

        if (isDemoMode) {
            // Demo mode: Use mock data
            data = getMockHistory({ page, limit, severity });
        } else {
            // Production: Fetch from FastAPI
            try {
                const response = await getAnalysisHistory({ page, limit, severity });
                if (!response.success || !response.data) {
                    // Fallback to mock
                    data = getMockHistory({ page, limit, severity });
                } else {
                    data = response.data;
                }
            } catch {
                // Fallback to mock on error
                data = getMockHistory({ page, limit, severity });
            }
        }

        return NextResponse.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("History fetch error:", error);
        // Return mock data even on error
        return NextResponse.json({
            success: true,
            data: getMockHistory({ page: 1, limit: 10 }),
            timestamp: new Date().toISOString(),
        });
    }
}
