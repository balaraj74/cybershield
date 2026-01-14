/**
 * API Route: Health Check
 * Returns system health status
 */
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function GET() {
    const isDemoMode = env.NEXT_PUBLIC_DEMO_MODE;

    // Check backend connectivity if not in demo mode
    let backendStatus = "unknown";
    if (!isDemoMode) {
        try {
            const response = await fetch(`${env.FASTAPI_URL}/health`, {
                method: "GET",
                headers: {
                    "X-API-Key": env.FASTAPI_API_KEY || "",
                },
                // Short timeout for health check
                signal: AbortSignal.timeout(5000),
            });
            backendStatus = response.ok ? "healthy" : "unhealthy";
        } catch {
            backendStatus = "disconnected";
        }
    } else {
        backendStatus = "demo";
    }

    return NextResponse.json({
        status: "healthy",
        version: "1.0.0",
        mode: isDemoMode ? "demo" : "live",
        backend: backendStatus,
        timestamp: new Date().toISOString(),
        services: {
            frontend: "healthy",
            backend: backendStatus,
            database: isDemoMode ? "mock" : backendStatus,
        },
    });
}
