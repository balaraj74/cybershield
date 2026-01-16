/**
 * SMS Scam Detection API - Uses AI to detect scam patterns in SMS
 */
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Common scam patterns
const SCAM_PATTERNS = {
    urgency: [/urgent/i, /immediately/i, /act now/i, /expires today/i, /last chance/i, /limited time/i],
    prizes: [/congratulations/i, /you('ve)? won/i, /winner/i, /prize/i, /lottery/i, /jackpot/i],
    money: [/\$\d+/i, /free money/i, /cash prize/i, /million/i, /claim your/i],
    threats: [/account.*(suspend|lock|close)/i, /verify.*(now|immediately)/i, /unusual activity/i],
    personal: [/ssn/i, /social security/i, /bank account/i, /credit card/i, /password/i],
    delivery: [/package.*(held|stuck|customs)/i, /delivery failed/i, /tracking/i, /shipment/i],
};

const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(com|net|org|xyz|top|click|link|site|online|tk|ml|ga|info|co)[^\s]*/gi;
const PHONE_PATTERN = /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Extract URLs and phone numbers
        const extractedLinks = extractLinks(message);
        const extractedPhones = message.match(PHONE_PATTERN) || [];

        // Detect scam patterns
        const redFlags = detectRedFlags(message);

        // Calculate risk score
        let riskScore = redFlags.length * 15;
        if (extractedLinks.some(l => !l.safe)) riskScore += 25;
        if (extractedPhones.length > 0 && redFlags.length > 0) riskScore += 10;
        riskScore = Math.min(100, riskScore);

        // Get AI analysis
        let aiAnalysis = {
            isScam: riskScore >= 40,
            scamType: determineScamType(redFlags),
            summary: "Basic pattern analysis complete.",
            advice: getDefaultAdvice(riskScore >= 40),
        };

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            const aiResult = await getAIAnalysis(message, geminiApiKey);
            if (aiResult) {
                aiAnalysis = { ...aiAnalysis, ...aiResult };
                // Adjust score based on AI confidence
                if (aiResult.isScam && riskScore < 50) riskScore = 60;
                if (!aiResult.isScam && riskScore < 30) riskScore = Math.max(0, riskScore - 10);
            }
        }

        // Determine risk level
        let riskLevel: "safe" | "low" | "medium" | "high" | "critical";
        if (riskScore >= 80) riskLevel = "critical";
        else if (riskScore >= 60) riskLevel = "high";
        else if (riskScore >= 40) riskLevel = "medium";
        else if (riskScore >= 20) riskLevel = "low";
        else riskLevel = "safe";

        return NextResponse.json({
            isScam: riskScore >= 40,
            confidence: Math.min(99, riskScore + 20),
            scamType: aiAnalysis.scamType,
            riskLevel,
            redFlags,
            extractedLinks,
            extractedPhones: extractedPhones.slice(0, 3),
            aiSummary: aiAnalysis.summary,
            advice: aiAnalysis.advice,
            analyzedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error("SMS check error:", error);
        return NextResponse.json(
            { error: "Failed to analyze message" },
            { status: 500 }
        );
    }
}

function extractLinks(message: string): { url: string; safe: boolean }[] {
    const urls = message.match(URL_PATTERN) || [];
    return urls.map(url => ({
        url,
        safe: !isSuspiciousURL(url),
    }));
}

function isSuspiciousURL(url: string): boolean {
    const suspiciousTLDs = [".xyz", ".top", ".click", ".link", ".site", ".online", ".tk", ".ml", ".ga"];
    const shorteners = ["bit.ly", "tinyurl", "t.co", "goo.gl", "ow.ly"];

    const lower = url.toLowerCase();
    return (
        suspiciousTLDs.some(tld => lower.includes(tld)) ||
        shorteners.some(s => lower.includes(s)) ||
        /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lower) ||
        /(paypa[l1]|amaz[o0]n|g[o0]{2}gle|micr[o0]s[o0]ft)/i.test(lower)
    );
}

function detectRedFlags(message: string): { flag: string; explanation: string }[] {
    const flags: { flag: string; explanation: string }[] = [];

    if (SCAM_PATTERNS.urgency.some(p => p.test(message))) {
        flags.push({
            flag: "Urgency Tactics",
            explanation: "Creates artificial urgency to pressure you into acting without thinking",
        });
    }

    if (SCAM_PATTERNS.prizes.some(p => p.test(message))) {
        flags.push({
            flag: "Prize/Lottery Scam",
            explanation: "Claims you've won something you never entered - classic scam technique",
        });
    }

    if (SCAM_PATTERNS.money.some(p => p.test(message))) {
        flags.push({
            flag: "Money-related Claims",
            explanation: "Promises of money or requests for payment are common in scams",
        });
    }

    if (SCAM_PATTERNS.threats.some(p => p.test(message))) {
        flags.push({
            flag: "Account Threat",
            explanation: "Threatens account suspension to scare you into clicking malicious links",
        });
    }

    if (SCAM_PATTERNS.personal.some(p => p.test(message))) {
        flags.push({
            flag: "Personal Info Request",
            explanation: "Legitimate companies never ask for sensitive info via SMS",
        });
    }

    if (SCAM_PATTERNS.delivery.some(p => p.test(message))) {
        flags.push({
            flag: "Delivery Scam",
            explanation: "Fake delivery notifications are a common phishing technique",
        });
    }

    // Check for suspicious links
    const urls = message.match(URL_PATTERN) || [];
    if (urls.some(isSuspiciousURL)) {
        flags.push({
            flag: "Suspicious Link",
            explanation: "Contains a link to a potentially dangerous website",
        });
    }

    return flags;
}

function determineScamType(flags: { flag: string }[]): string {
    const flagNames = flags.map(f => f.flag.toLowerCase());

    if (flagNames.some(f => f.includes("prize") || f.includes("lottery"))) return "Prize/Lottery Scam";
    if (flagNames.some(f => f.includes("delivery"))) return "Delivery Scam";
    if (flagNames.some(f => f.includes("account"))) return "Account Phishing";
    if (flagNames.some(f => f.includes("money"))) return "Financial Scam";
    if (flagNames.some(f => f.includes("personal"))) return "Identity Theft Attempt";
    return "Suspicious Message";
}

function getDefaultAdvice(isScam: boolean): string[] {
    if (isScam) {
        return [
            "Do NOT click any links in this message",
            "Do NOT reply or provide any personal information",
            "Block the sender's number",
            "Report this message to your carrier (forward to 7726/SPAM)",
            "Delete the message",
        ];
    }
    return [
        "The message appears safe, but always stay vigilant",
        "If you're unsure, contact the company directly through their official website",
        "Never share sensitive information via SMS",
    ];
}

async function getAIAnalysis(message: string, apiKey: string): Promise<{
    isScam: boolean;
    scamType: string;
    summary: string;
    advice: string[];
} | null> {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this SMS message for scam/fraud indicators:

"${message}"

Return ONLY a JSON object:
{
  "isScam": true/false,
  "scamType": "type of scam or 'Legitimate Message'",
  "summary": "2-3 sentence analysis of why this is or isn't a scam",
  "advice": ["action item 1", "action item 2", "action item 3"]
}

Consider: urgency tactics, suspicious links, requests for personal info, prize claims, account threats, delivery scams, typos, impersonation.`
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
