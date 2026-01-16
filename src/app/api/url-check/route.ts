/**
 * URL Safety Check API - Analyzes URLs for threats using AI
 */
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Known suspicious TLDs
const SUSPICIOUS_TLDS = [".xyz", ".top", ".click", ".link", ".work", ".online", ".site", ".tk", ".ml", ".ga"];
// Known URL shorteners
const URL_SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"];
// Known phishing patterns
const PHISHING_PATTERNS = [
    /paypa[l1]/i, /amaz[o0]n/i, /g[o0]{2}gle/i, /faceb[o0]{2}k/i,
    /micr[o0]s[o0]ft/i, /app[l1]e/i, /netf[l1]ix/i, /secure-.*login/i,
    /verify-.*account/i, /update-.*info/i, /login-.*secure/i
];

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== "string") {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Parse and analyze URL
        let parsedUrl: URL;
        try {
            // Add protocol if missing
            const urlWithProtocol = url.startsWith("http") ? url : `https://${url}`;
            parsedUrl = new URL(urlWithProtocol);
        } catch {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            );
        }

        const domain = parsedUrl.hostname.toLowerCase();
        const analysis = analyzeURL(parsedUrl, domain);

        // Use AI for additional analysis if API key available
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey && analysis.riskScore > 20) {
            const aiAnalysis = await getAIAnalysis(url, geminiApiKey);
            if (aiAnalysis) {
                analysis.threats = [...analysis.threats, ...aiAnalysis.additionalThreats];
                analysis.recommendations = [...analysis.recommendations, ...aiAnalysis.recommendations];
            }
        }

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("URL check error:", error);
        return NextResponse.json(
            { error: "Failed to analyze URL" },
            { status: 500 }
        );
    }
}

function analyzeURL(parsedUrl: URL, domain: string) {
    const threats: string[] = [];
    let riskScore = 0;

    // Check for HTTPS
    const isHTTPS = parsedUrl.protocol === "https:";
    if (!isHTTPS) {
        riskScore += 20;
        threats.push("URL uses HTTP instead of secure HTTPS");
    }

    // Check for suspicious TLD
    const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
    if (hasSuspiciousTLD) {
        riskScore += 25;
        threats.push("Suspicious top-level domain (TLD)");
    }

    // Check for URL shortener
    const isShortener = URL_SHORTENERS.some(s => domain.includes(s));
    if (isShortener) {
        riskScore += 15;
        threats.push("URL shortener detected - final destination hidden");
    }

    // Check for phishing patterns
    const matchedPatterns = PHISHING_PATTERNS.filter(p => p.test(domain) || p.test(parsedUrl.pathname));
    if (matchedPatterns.length > 0) {
        riskScore += 40;
        threats.push("Potential brand impersonation/typosquatting detected");
    }

    // Check for IP address as domain
    const isIPAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain);
    if (isIPAddress) {
        riskScore += 30;
        threats.push("URL uses IP address instead of domain name");
    }

    // Check for long subdomain (often used in phishing)
    const subdomainParts = domain.split(".");
    if (subdomainParts.length > 3) {
        riskScore += 15;
        threats.push("Multiple subdomains detected (common in phishing)");
    }

    // Check for suspicious characters
    if (domain.includes("-") && (domain.includes("login") || domain.includes("secure") || domain.includes("verify"))) {
        riskScore += 20;
        threats.push("Suspicious keyword combination in domain");
    }

    // Check for data: or javascript: schemes
    if (parsedUrl.protocol === "data:" || parsedUrl.protocol === "javascript:") {
        riskScore += 50;
        threats.push("Dangerous URL scheme detected");
    }

    // Check URL length
    if (parsedUrl.href.length > 200) {
        riskScore += 10;
        threats.push("Unusually long URL (may hide actual destination)");
    }

    // Determine risk level
    let riskLevel: "safe" | "low" | "medium" | "high" | "critical";
    if (riskScore >= 70) riskLevel = "critical";
    else if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 30) riskLevel = "medium";
    else if (riskScore >= 15) riskLevel = "low";
    else riskLevel = "safe";

    // Generate recommendations
    const recommendations: string[] = [];
    if (!isHTTPS) recommendations.push("Always prefer HTTPS websites for secure data transmission");
    if (isShortener) recommendations.push("Use a URL expander to see the actual destination before clicking");
    if (riskScore >= 30) recommendations.push("Do not enter personal information on this website");
    if (riskScore >= 50) recommendations.push("Do not visit this URL - it may be dangerous");
    if (matchedPatterns.length > 0) recommendations.push("Navigate directly to the official website instead of clicking this link");
    if (threats.length === 0) recommendations.push("Still exercise caution - no analysis is 100% accurate");

    return {
        url: parsedUrl.href,
        safe: riskScore < 30,
        riskLevel,
        riskScore: Math.min(100, riskScore),
        threats,
        details: {
            domain,
            registrationAge: estimateDomainAge(domain),
            ssl: isHTTPS,
            redirects: isShortener,
            suspiciousPatterns: matchedPatterns.map(p => p.toString()),
        },
        recommendations,
    };
}

function estimateDomainAge(domain: string): string {
    // In production, you'd query WHOIS data
    // For demo, we'll use domain characteristics to estimate
    const wellKnownDomains = ["google.com", "facebook.com", "amazon.com", "microsoft.com", "apple.com", "github.com"];
    if (wellKnownDomains.some(d => domain.endsWith(d))) {
        return "10+ years (established)";
    }

    const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
    if (hasSuspiciousTLD) {
        return "< 1 year (recent)";
    }

    return "Unknown";
}

async function getAIAnalysis(url: string, apiKey: string): Promise<{ additionalThreats: string[]; recommendations: string[] } | null> {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this URL for security threats: ${url}
                        
Return ONLY a JSON object with:
{
  "additionalThreats": ["threat1", "threat2"],
  "recommendations": ["rec1", "rec2"]
}

Focus on: phishing, typosquatting, suspicious patterns, known malicious domains.
Return empty arrays if no additional threats found.`
                    }]
                }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
            }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) cleanText = cleanText.slice(7);
        if (cleanText.startsWith("```")) cleanText = cleanText.slice(3);
        if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);

        return JSON.parse(cleanText.trim());
    } catch {
        return null;
    }
}
