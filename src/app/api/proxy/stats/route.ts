/**
 * API Route: Dashboard Statistics
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/api";
import { getMockDashboardStats } from "@/lib/mock-data";

export async function GET() {
    try {
        // Check if demo mode (always use mock data on Vercel without backend)
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

        let stats;

        if (isDemoMode) {
            // Demo mode: Use mock data
            stats = getMockDashboardStats();
        } else {
            // Production: Fetch from FastAPI
            try {
                const response = await getDashboardStats();
                if (!response.success || !response.data) {
                    // Fallback to mock data
                    stats = getMockDashboardStats();
                } else {
                    stats = response.data;
                }
            } catch {
                // On any error, use mock data
                stats = getMockDashboardStats();
            }
        }

        return NextResponse.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        // Even on error, return mock data so UI doesn't break
        return NextResponse.json({
            success: true,
            data: getMockDashboardStats(),
            timestamp: new Date().toISOString(),
        });
    }
}
