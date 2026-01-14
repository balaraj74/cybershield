/**
 * API Route: Analysis History
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalysisHistory } from "@/lib/api";
import { getMockHistory } from "@/lib/mock-data";
import { env } from "@/env";

export async function GET(request: NextRequest) {
    try {
        // Authentication check
        const session = await auth();
        if (!session?.user) {
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

        if (env.NEXT_PUBLIC_DEMO_MODE) {
            // Demo mode: Use mock data
            data = getMockHistory({ page, limit, severity });
        } else {
            // Production: Fetch from FastAPI
            const response = await getAnalysisHistory({ page, limit, severity });
            if (!response.success || !response.data) {
                return NextResponse.json(
                    {
                        error: response.error || {
                            code: "FETCH_FAILED",
                            message: "Unable to fetch history",
                        },
                    },
                    { status: 503 }
                );
            }
            data = response.data;
        }

        return NextResponse.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("History fetch error:", error);
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
