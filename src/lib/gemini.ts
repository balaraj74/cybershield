/**
 * Gemini AI Integration for Threat Analysis
 * Uses Google Gemini 2.5 Flash for real-time threat detection
 */

import type { AnalysisResult, SeverityLevel, ThreatType, AnalysisInputType } from "@/types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
    candidates?: {
        content?: {
            parts?: { text?: string }[];
        };
    }[];
    error?: {
        message: string;
    };
}

interface ThreatAnalysisOutput {
    threatType: ThreatType;
    severity: SeverityLevel;
    riskScore: number;
    confidence: number;
    summary: string;
    explanation: { title: string; content: string; severity: SeverityLevel }[];
    indicators: { type: string; value: string; riskContribution: number; description: string }[];
    recommendations: string[];
    riskContributions: { factor: string; weight: number }[];
}

const SYSTEM_PROMPT = `You are CyberShield AI, an advanced cybersecurity threat detection system. Analyze the provided content for potential threats including:

- Phishing attempts (credential harvesting, fake login pages, impersonation)
- Malware/ransomware distribution
- Social engineering attacks (CEO fraud, pretexting, baiting)
- Spam and unwanted content
- Credential theft attempts
- Data exfiltration attempts
- Malicious URLs
- Suspicious patterns

For each analysis, you must respond with ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "threatType": "phishing|malware|spam|social_engineering|credential_theft|data_exfiltration|url_threat|safe|unknown",
  "severity": "critical|high|medium|low|safe",
  "riskScore": <0-100>,
  "confidence": <0.0-1.0>,
  "summary": "<Brief 1-2 sentence summary of the threat>",
  "explanation": [
    {"title": "<Section title>", "content": "<Detailed explanation>", "severity": "critical|high|medium|low|safe"}
  ],
  "indicators": [
    {"type": "<indicator type>", "value": "<what was found>", "riskContribution": <0-100>, "description": "<why this is concerning>"}
  ],
  "recommendations": ["<action 1>", "<action 2>"],
  "riskContributions": [
    {"factor": "<risk factor name>", "weight": <percentage contribution>}
  ]
}

Risk Score Guidelines:
- 90-100: Critical threat, immediate action required
- 70-89: High risk, significant threat detected
- 40-69: Medium risk, suspicious elements present
- 20-39: Low risk, minor concerns
- 0-19: Safe, no significant threats detected

Be thorough but accurate. Only flag genuine threats. Analyze the actual content, not just keywords.`;

export async function analyzeWithGemini(
    type: AnalysisInputType,
    content: string,
    apiKey: string
): Promise<ThreatAnalysisOutput> {
    const contentPrompt = buildContentPrompt(type, content);

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: SYSTEM_PROMPT },
                            { text: contentPrompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 2048,
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                ]
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API error:", errorData);
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error("No response from Gemini");
        }

        // Parse the JSON response
        const result = parseGeminiResponse(textContent);
        return result;

    } catch (error) {
        console.error("Gemini analysis error:", error);
        // Return a fallback analysis if API fails
        return getFallbackAnalysis(type, content);
    }
}

function buildContentPrompt(type: AnalysisInputType, content: string): string {
    switch (type) {
        case "email":
            return `Analyze this EMAIL for potential threats:\n\n---EMAIL START---\n${content}\n---EMAIL END---\n\nProvide your threat analysis as JSON.`;
        case "url":
            return `Analyze this URL for potential threats:\n\n---URL---\n${content}\n---URL END---\n\nProvide your threat analysis as JSON.`;
        case "message":
            return `Analyze this MESSAGE/TEXT for potential threats:\n\n---MESSAGE START---\n${content}\n---MESSAGE END---\n\nProvide your threat analysis as JSON.`;
        default:
            return `Analyze this content for potential threats:\n\n${content}\n\nProvide your threat analysis as JSON.`;
    }
}

function parseGeminiResponse(text: string): ThreatAnalysisOutput {
    // Remove any markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    try {
        const parsed = JSON.parse(cleanText);

        // Convert confidence from decimal (0-1) to percentage (0-100) if needed
        let confidenceValue = Number(parsed.confidence) || 0.5;
        if (confidenceValue <= 1) {
            confidenceValue = confidenceValue * 100; // Convert 0.95 to 95
        }

        // Validate and sanitize the response
        return {
            threatType: validateThreatType(parsed.threatType),
            severity: validateSeverity(parsed.severity),
            riskScore: Math.max(0, Math.min(100, Number(parsed.riskScore) || 0)),
            confidence: Math.max(0, Math.min(100, Math.round(confidenceValue))),
            summary: String(parsed.summary || "Analysis complete"),
            explanation: Array.isArray(parsed.explanation) ? parsed.explanation : [],
            indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            riskContributions: Array.isArray(parsed.riskContributions) ? parsed.riskContributions : [],
        };
    } catch (e) {
        console.error("Failed to parse Gemini response:", text, e);
        throw new Error("Failed to parse AI response");
    }
}

function validateThreatType(type: string): ThreatType {
    const validTypes: ThreatType[] = [
        "phishing", "malware", "spam", "social_engineering",
        "credential_theft", "data_exfiltration", "url_threat", "unknown"
    ];
    return validTypes.includes(type as ThreatType) ? (type as ThreatType) : "unknown";
}

function validateSeverity(severity: string): SeverityLevel {
    const validSeverities: SeverityLevel[] = ["critical", "high", "medium", "low", "safe"];
    return validSeverities.includes(severity as SeverityLevel) ? (severity as SeverityLevel) : "medium";
}

function getFallbackAnalysis(type: AnalysisInputType, content: string): ThreatAnalysisOutput {
    // Basic heuristic analysis as fallback
    const lowerContent = content.toLowerCase();

    // Check for common threat indicators
    const phishingKeywords = ["urgent", "verify your account", "click here", "password", "suspended", "confirm your"];
    const malwareKeywords = [".exe", ".dll", "download now", "install", "run this"];
    const suspiciousPatterns = ["http://", "bit.ly", "tinyurl", "click."];

    let riskScore = 10;
    let threatType: ThreatType = "unknown";
    let severity: SeverityLevel = "safe";
    const indicators: ThreatAnalysisOutput["indicators"] = [];

    phishingKeywords.forEach(kw => {
        if (lowerContent.includes(kw)) {
            riskScore += 15;
            indicators.push({
                type: "keyword",
                value: kw,
                riskContribution: 15,
                description: "Common phishing keyword detected"
            });
        }
    });

    malwareKeywords.forEach(kw => {
        if (lowerContent.includes(kw)) {
            riskScore += 20;
            indicators.push({
                type: "keyword",
                value: kw,
                riskContribution: 20,
                description: "Potential malware indicator"
            });
        }
    });

    suspiciousPatterns.forEach(pattern => {
        if (lowerContent.includes(pattern)) {
            riskScore += 10;
        }
    });

    riskScore = Math.min(100, riskScore);

    if (riskScore >= 70) {
        severity = "high";
        threatType = indicators.length > 0 && indicators[0].type === "keyword" ? "phishing" : "unknown";
    } else if (riskScore >= 40) {
        severity = "medium";
        threatType = "unknown";
    } else if (riskScore >= 20) {
        severity = "low";
    }

    return {
        threatType,
        severity,
        riskScore,
        confidence: 60, // 60% confidence for fallback analysis
        summary: "Fallback analysis - AI service temporarily unavailable",
        explanation: [
            {
                title: "Basic Analysis",
                content: "This analysis was performed using basic heuristics as the AI service was temporarily unavailable.",
                severity: severity
            }
        ],
        indicators,
        recommendations: riskScore > 30 ? ["Review content carefully", "Verify sender if applicable"] : ["No immediate action required"],
        riskContributions: [{ factor: "Keyword Detection", weight: 100 }]
    };
}
