/**
 * API client for communication with FastAPI backend
 * Acts as a secure gateway - no ML logic here
 */
import { env } from "@/env";
import type { AnalysisRequest, AnalysisResult, ThreatStats, ApiResponse } from "@/types";

const FASTAPI_URL = env.FASTAPI_URL;
const API_KEY = env.FASTAPI_API_KEY;

interface FetchOptions extends RequestInit {
    timeout?: number;
}

/**
 * Secure fetch wrapper with timeout and error handling
 */
async function secureFetch<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<ApiResponse<T>> {
    const { timeout = 30000, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(API_KEY && { "X-API-Key": API_KEY }),
            ...((fetchOptions.headers as Record<string, string>) ?? {}),
        };

        const response = await fetch(`${FASTAPI_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Don't expose internal errors
            const errorMessage = response.status >= 500
                ? "Backend service unavailable"
                : "Request failed";

            return {
                success: false,
                error: {
                    code: `HTTP_${response.status}`,
                    message: errorMessage,
                },
                timestamp: new Date().toISOString(),
            };
        }

        const data = await response.json();

        return {
            success: true,
            data: data as T,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort/timeout
        if ((error as Error).name === "AbortError") {
            return {
                success: false,
                error: {
                    code: "TIMEOUT",
                    message: "Request timed out",
                },
                timestamp: new Date().toISOString(),
            };
        }

        // Generic error - don't expose internals
        return {
            success: false,
            error: {
                code: "NETWORK_ERROR",
                message: "Unable to connect to analysis service",
            },
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Submit content for threat analysis
 */
export async function analyzeContent(
    request: AnalysisRequest
): Promise<ApiResponse<AnalysisResult>> {
    const response = await secureFetch<{ success: boolean; data: AnalysisResult }>("/analyze", {
        method: "POST",
        body: JSON.stringify({
            type: request.type,
            content: request.content,
            metadata: request.metadata,
        }),
    });

    // Extract data from FastAPI response wrapper
    if (response.success && response.data) {
        return {
            success: true,
            data: response.data.data,
            timestamp: new Date().toISOString(),
        };
    }
    // Return error response
    return {
        success: false,
        error: response.error,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<ApiResponse<ThreatStats>> {
    const response = await secureFetch<{ success: boolean; data: ThreatStats }>("/dashboard/stats");

    // Extract data from FastAPI response wrapper
    if (response.success && response.data) {
        return {
            success: true,
            data: response.data.data,
            timestamp: new Date().toISOString(),
        };
    }
    // Return error response
    return {
        success: false,
        error: response.error,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Get analysis history
 */
export async function getAnalysisHistory(params?: {
    page?: number;
    limit?: number;
    severity?: string;
    threatType?: string;
    inputType?: string;
}): Promise<ApiResponse<{ items: AnalysisResult[]; total: number; hasMore: boolean }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("page_size", String(params.limit));
    if (params?.severity) searchParams.set("severity", params.severity);
    if (params?.threatType) searchParams.set("threat_type", params.threatType);
    if (params?.inputType) searchParams.set("input_type", params.inputType);

    const query = searchParams.toString();
    const endpoint = `/history${query ? `?${query}` : ""}`;

    const response = await secureFetch<{ success: boolean; data: { items: AnalysisResult[]; total: number; hasMore: boolean } }>(endpoint);

    if (response.success && response.data) {
        return {
            success: true,
            data: response.data.data,
            timestamp: new Date().toISOString(),
        };
    }
    // Return error response
    return {
        success: false,
        error: response.error,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Health check for FastAPI backend
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await secureFetch<{ status: string }>("/health", {
            timeout: 5000,
        });
        return response.success && response.data?.status === "healthy";
    } catch {
        return false;
    }
}
