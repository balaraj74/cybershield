/**
 * API Route: Dashboard Statistics
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/api";
import { getMockDashboardStats } from "@/lib/mock-data";
import { env } from "@/env";

export async function GET() {
    try {
        // Authentication check
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        let stats;

        if (env.NEXT_PUBLIC_DEMO_MODE) {
            // Demo mode: Use mock data
            stats = getMockDashboardStats();
        } else {
            // Production: Fetch from FastAPI
            const response = await getDashboardStats();
            if (!response.success || !response.data) {
                return NextResponse.json(
                    {
                        error: response.error || {
                            code: "FETCH_FAILED",
                            message: "Unable to fetch dashboard stats",
                        },
                    },
                    { status: 503 }
                );
            }
            stats = response.data;
        }

        return NextResponse.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
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
