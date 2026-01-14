/**
 * Mock data service for demo mode
 * Provides realistic sample data when FastAPI backend is not available
 */
import type {
    ThreatStats,
    AnalysisResult,
    HistoryEntry,
    ThreatType,
    SeverityLevel,
    AnalysisInputType,
    ExplanationSection,
    ThreatIndicator,
} from "@/types";
import { generateId, generateHash } from "@/lib/utils";

// Helper to generate random number in range
const randomInRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

// Generate realistic threat stats for dashboard
export function getMockDashboardStats(): ThreatStats {
    const now = new Date();

    // Generate threats over time (last 7 days)
    const threatsOverTime = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return {
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            count: randomInRange(5, 45),
        };
    });

    const threatsByType: Record<ThreatType, number> = {
        phishing: randomInRange(20, 50),
        malware: randomInRange(10, 30),
        spam: randomInRange(30, 60),
        social_engineering: randomInRange(5, 20),
        credential_theft: randomInRange(8, 25),
        url_threat: randomInRange(15, 35),
        data_exfiltration: randomInRange(3, 15),
        unknown: randomInRange(2, 10),
    };

    const totalThreats = Object.values(threatsByType).reduce((a, b) => a + b, 0);
    const highRiskCount = threatsByType.phishing +
        threatsByType.malware +
        threatsByType.credential_theft +
        threatsByType.data_exfiltration;

    // Generate recent alerts
    const recentAlerts: HistoryEntry[] = [
        {
            id: generateId(),
            inputType: "email",
            inputHash: "a1b2c3d4e5f6",
            threatType: "phishing",
            severity: "critical",
            riskScore: 92,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            analyzedBy: "Analyst",
        },
        {
            id: generateId(),
            inputType: "url",
            inputHash: "f6e5d4c3b2a1",
            threatType: "malware",
            severity: "high",
            riskScore: 78,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            analyzedBy: "Analyst",
        },
        {
            id: generateId(),
            inputType: "message",
            inputHash: "1a2b3c4d5e6f",
            threatType: "social_engineering",
            severity: "medium",
            riskScore: 55,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            analyzedBy: "Admin",
        },
        {
            id: generateId(),
            inputType: "email",
            inputHash: "6f5e4d3c2b1a",
            threatType: "spam",
            severity: "low",
            riskScore: 28,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            analyzedBy: "System",
        },
    ];

    return {
        totalThreats,
        highRiskCount,
        threatsByType,
        threatsOverTime,
        recentAlerts,
    };
}

// Phishing detection patterns
const phishingIndicators = [
    { pattern: "urgent", keyword: "urgent", description: "Creates artificial urgency to bypass rational thinking" },
    { pattern: "verify", keyword: "verify your account", description: "Attempts to collect account credentials" },
    { pattern: "click here", keyword: "click here", description: "Generic call-to-action often used in phishing" },
    { pattern: "suspended", keyword: "account suspended", description: "Fear-based tactic to prompt immediate action" },
    { pattern: "password", keyword: "password", description: "Attempting to collect sensitive credentials" },
    { pattern: "confirm", keyword: "confirm your identity", description: "Identity verification scam tactic" },
    { pattern: "limited time", keyword: "limited time", description: "Pressure tactic to prevent careful consideration" },
    { pattern: "winner", keyword: "winner", description: "Prize scam indicator" },
];

// URL threat patterns
const urlThreatIndicators = [
    { pattern: /bit\.ly|tinyurl/i, description: "URL shortener hiding actual destination" },
    { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i, description: "IP address instead of domain name" },
    { pattern: /paypal|apple|amazon|google|microsoft/i, description: "Potential brand impersonation" },
    { pattern: /-login|-verify|-secure/i, description: "Suspicious subdomain pattern" },
    { pattern: /\.xyz|\.top|\.club|\.work/i, description: "Suspicious top-level domain" },
];

// Generate mock analysis result based on content
export async function getMockAnalysisResult(
    type: AnalysisInputType,
    content: string
): Promise<AnalysisResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const contentLower = content.toLowerCase();
    let riskScore = 15; // Base safe score
    let threatType: ThreatType = "unknown";
    const indicators: ThreatIndicator[] = [];
    const explanations: ExplanationSection[] = [];

    // Check for phishing indicators
    for (const indicator of phishingIndicators) {
        if (contentLower.includes(indicator.pattern)) {
            riskScore += randomInRange(8, 15);
            threatType = "phishing";
            indicators.push({
                type: "keyword",
                value: indicator.keyword,
                riskContribution: randomInRange(10, 20),
                description: indicator.description,
            });
        }
    }

    // Check for URL threats
    if (type === "url") {
        for (const indicator of urlThreatIndicators) {
            if (indicator.pattern.test(content)) {
                riskScore += randomInRange(15, 25);
                threatType = "url_threat";
                indicators.push({
                    type: "url",
                    value: content.substring(0, 50),
                    riskContribution: randomInRange(15, 25),
                    description: indicator.description,
                });
            }
        }
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Determine severity based on risk score
    let severity: SeverityLevel;
    if (riskScore >= 80) severity = "critical";
    else if (riskScore >= 60) severity = "high";
    else if (riskScore >= 40) severity = "medium";
    else if (riskScore >= 20) severity = "low";
    else severity = "safe";

    // Generate explanations based on findings
    if (indicators.length > 0) {
        explanations.push({
            title: "Why This Was Flagged",
            content: `Our AI detected ${indicators.length} suspicious element(s) that are commonly associated with ${threatType.replace("_", " ")} attacks. These patterns match known tactics used by malicious actors.`,
            severity,
            indicators: indicators.slice(0, 3),
        });

        explanations.push({
            title: "What This Means For You",
            content: severity === "critical" || severity === "high"
                ? "This content poses a significant security risk. Do NOT click any links, download attachments, or provide any personal information. If this came from someone you know, verify through a different communication channel."
                : severity === "medium"
                    ? "This content shows some suspicious characteristics. Proceed with caution and verify the source before taking any action."
                    : "While some elements raised minor flags, the overall risk appears low. Still, maintain general security awareness.",
            severity,
        });

        if (threatType === "phishing") {
            explanations.push({
                title: "Common Phishing Tactics Detected",
                content: "Phishing attacks try to trick you into revealing sensitive information by pretending to be a trusted entity. They often create urgency, threaten account closure, or promise rewards to manipulate your actions.",
                severity: "info" as SeverityLevel,
            });
        }
    } else {
        explanations.push({
            title: "Analysis Summary",
            content: "No significant threats were detected in this content. Our AI analyzed the text for known malicious patterns, suspicious URLs, and social engineering tactics - all checks passed.",
            severity: "safe",
        });
    }

    // Generate recommendations
    const recommendations = [];
    if (riskScore >= 60) {
        recommendations.push("Do not click any links in this message");
        recommendations.push("Do not download or open any attachments");
        recommendations.push("Report this message to your IT security team");
        recommendations.push("If you already clicked a link, change your passwords immediately");
    } else if (riskScore >= 30) {
        recommendations.push("Verify the sender's identity through official channels");
        recommendations.push("Hover over links to check their actual destination before clicking");
        recommendations.push("Be cautious about providing any personal information");
    } else {
        recommendations.push("Continue to practice safe browsing habits");
        recommendations.push("Keep your security software up to date");
    }

    const inputHash = await generateHash(content);

    return {
        id: generateId(),
        threatType,
        riskScore,
        severity,
        confidence: randomInRange(75, 98),
        summary: riskScore >= 60
            ? `High-risk ${threatType.replace("_", " ")} detected with ${indicators.length} suspicious indicators. Immediate caution advised.`
            : riskScore >= 30
                ? `Moderate risk identified. Some suspicious elements found that warrant attention.`
                : `Content appears safe. No significant threats detected.`,
        explanation: explanations,
        indicators,
        recommendations,
        analyzedAt: new Date().toISOString(),
        inputHash: inputHash.substring(0, 12),
    };
}

// Generate mock history data
export function getMockHistory(params?: {
    page?: number;
    limit?: number;
    severity?: string;
}): { items: HistoryEntry[]; total: number } {
    const allItems: HistoryEntry[] = [
        {
            id: generateId(),
            inputType: "email",
            inputHash: "abc123def456",
            threatType: "phishing",
            severity: "critical",
            riskScore: 95,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            analyzedBy: "admin@cybershield.ai",
        },
        {
            id: generateId(),
            inputType: "url",
            inputHash: "def456ghi789",
            threatType: "malware",
            severity: "high",
            riskScore: 82,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            analyzedBy: "analyst@cybershield.ai",
        },
        {
            id: generateId(),
            inputType: "message",
            inputHash: "ghi789jkl012",
            threatType: "social_engineering",
            severity: "medium",
            riskScore: 58,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            analyzedBy: "analyst@cybershield.ai",
        },
        {
            id: generateId(),
            inputType: "email",
            inputHash: "jkl012mno345",
            threatType: "spam",
            severity: "low",
            riskScore: 32,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            analyzedBy: "admin@cybershield.ai",
        },
        {
            id: generateId(),
            inputType: "url",
            inputHash: "mno345pqr678",
            threatType: "unknown",
            severity: "safe",
            riskScore: 12,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            analyzedBy: "analyst@cybershield.ai",
        },
        {
            id: generateId(),
            inputType: "email",
            inputHash: "pqr678stu901",
            threatType: "credential_theft",
            severity: "critical",
            riskScore: 91,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
            analyzedBy: "admin@cybershield.ai",
        },
        {
            id: generateId(),
            inputType: "message",
            inputHash: "stu901vwx234",
            threatType: "url_threat",
            severity: "high",
            riskScore: 75,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
            analyzedBy: "analyst@cybershield.ai",
        },
        {
            id: generateId(),
            inputType: "url",
            inputHash: "vwx234yza567",
            threatType: "phishing",
            severity: "high",
            riskScore: 68,
            analyzedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
            analyzedBy: "admin@cybershield.ai",
        },
    ];

    // Filter by severity if provided
    let filteredItems = allItems;
    if (params?.severity && params.severity !== "all") {
        filteredItems = allItems.filter((item) => item.severity === params.severity);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
        items: filteredItems.slice(start, end),
        total: filteredItems.length,
    };
}
