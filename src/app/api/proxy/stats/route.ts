/**
 * API Route: Dashboard Statistics
 * Fetches real data from Supabase
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Get user (optional for public stats)
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch threat analyses from Supabase
        const { data: analyses, error } = await supabase
            .from("threat_analyses")
            .select("*")
            .order("analyzed_at", { ascending: false })
            .limit(100);

        if (error) {
            console.error("Supabase error:", error);
            // Return default stats on error
            return NextResponse.json({
                success: true,
                data: getDefaultStats(),
                timestamp: new Date().toISOString(),
            });
        }

        // Calculate stats from real data
        const stats = calculateStats(analyses || []);

        return NextResponse.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
            user: user?.email,
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({
            success: true,
            data: getDefaultStats(),
            timestamp: new Date().toISOString(),
        });
    }
}

function calculateStats(analyses: any[]) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate metrics
    const totalThreats = analyses.filter(a => a.severity !== "safe").length;
    const highRiskCount = analyses.filter(a => ["critical", "high"].includes(a.severity)).length;
    const todayThreats = analyses.filter(a => new Date(a.analyzed_at) >= oneDayAgo).length;

    // Calculate average risk score
    const riskScores = analyses.map(a => a.risk_score).filter(Boolean);
    const avgRiskScore = riskScores.length > 0
        ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
        : 0;

    // Calculate threat trends (last 7 days)
    const trendData: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const count = analyses.filter(a =>
            a.analyzed_at && a.analyzed_at.startsWith(dateStr)
        ).length;
        trendData.push({ date: dateStr, count });
    }

    // Calculate threats by category
    const categoryCount: Record<string, number> = {};
    analyses.forEach(a => {
        const type = a.threat_type || "unknown";
        categoryCount[type] = (categoryCount[type] || 0) + 1;
    });
    const threatsByCategory = Object.entries(categoryCount).map(([name, value]) => ({
        name: formatCategoryName(name),
        value
    }));

    // Get recent alerts (high severity)
    const recentAlerts = analyses
        .filter(a => ["critical", "high"].includes(a.severity))
        .slice(0, 5)
        .map(a => ({
            id: a.id,
            type: a.threat_type,
            severity: a.severity,
            inputType: a.input_type,
            timestamp: a.analyzed_at,
            riskScore: a.risk_score,
            summary: a.summary
        }));

    // Most recent analysis time
    const lastAnalysis = analyses.length > 0
        ? getTimeAgo(new Date(analyses[0].analyzed_at))
        : "No analyses yet";

    return {
        totalThreats,
        highRiskCount: highRiskCount,
        activeMonitoring: "24/7",
        lastAnalysis,
        avgRiskScore,
        threatsToday: todayThreats,
        changePercent: calculateChange(analyses, oneWeekAgo),
        threatsOverTime: trendData,
        threatsByType: Object.fromEntries(threatsByCategory.map(t => [t.name.toLowerCase().replace(/\s/g, '_'), t.value])),
        threatsByCategory,
        recentAlerts,
        severityDistribution: calculateSeverityDistribution(analyses)
    };
}

function formatCategoryName(name: string): string {
    const names: Record<string, string> = {
        phishing: "Phishing",
        malware: "Malware",
        spam: "Spam",
        social_engineering: "Social Eng.",
        credential_theft: "Credential Theft",
        data_exfiltration: "Data Exfil.",
        safe: "Safe",
        unknown: "Unknown"
    };
    return names[name] || name;
}

function calculateChange(analyses: any[], since: Date): number {
    const recent = analyses.filter(a => new Date(a.analyzed_at) >= since).length;
    const older = analyses.filter(a => new Date(a.analyzed_at) < since).length;
    if (older === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - older) / older) * 100);
}

function calculateSeverityDistribution(analyses: any[]) {
    const distribution: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        safe: 0
    };
    analyses.forEach(a => {
        if (distribution[a.severity] !== undefined) {
            distribution[a.severity]++;
        }
    });
    return Object.entries(distribution).map(([severity, count]) => ({
        severity,
        count
    }));
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

function getDefaultStats() {
    return {
        totalThreats: 0,
        highRiskAlerts: 0,
        activeMonitoring: "24/7",
        lastAnalysis: "No analyses yet",
        avgRiskScore: 0,
        threatsToday: 0,
        changePercent: 0,
        trendData: [],
        threatsByCategory: [],
        recentAlerts: [],
        severityDistribution: []
    };
}
