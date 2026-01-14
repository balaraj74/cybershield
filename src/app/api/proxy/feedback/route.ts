/**
 * API Route: Feedback
 * Proxy for submitting user feedback on analysis
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/env";

// Validation schema
const feedbackSchema = z.object({
    analysisHash: z.string().min(1),
    feedbackType: z.enum(["false_positive", "false_negative", "accurate"]),
    comment: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = feedbackSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: { code: "VALIDATION_ERROR", message: "Invalid request data" } },
                { status: 400 }
            );
        }

        if (env.NEXT_PUBLIC_DEMO_MODE) {
            // Mock response in demo mode
            return NextResponse.json({
                success: true,
                data: {
                    success: true,
                    message: "Feedback recorded (Demo Mode)",
                    feedbackId: "demo-feedback-" + Date.now(),
                },
            });
        }

        // Forward to FastAPI
        const response = await fetch(`${env.FASTAPI_URL}/feedback`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": env.FASTAPI_API_KEY || "",
            },
            body: JSON.stringify(validation.data),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: { code: "BACKEND_ERROR", message: "Failed to submit feedback" } },
                { status: 502 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Feedback error:", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
            { status: 500 }
        );
    }
}
