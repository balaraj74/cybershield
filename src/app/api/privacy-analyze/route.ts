/**
 * Privacy Policy Analyzer API - Uses Gemini to analyze privacy policies
 */
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const ANALYSIS_PROMPT = `You are a privacy policy analyst. Analyze the provided privacy policy and return a detailed assessment in JSON format.

Evaluate the following aspects:
1. What personal data is collected
2. How data is used and shared
3. Third-party sharing practices
4. Data retention policies
5. User rights and controls
6. Security measures
7. Cookie usage
8. Overall privacy friendliness

Return ONLY valid JSON (no markdown) with this exact structure:

{
  "overallRisk": "low|medium|high|critical",
  "privacyScore": <0-100>,
  "summary": "<2-3 sentence plain English summary of what this policy means for users>",
  "dataCollected": [
    {"type": "<data type>", "purpose": "<why collected>", "risk": "low|medium|high"}
  ],
  "thirdPartySharing": [
    {"partner": "<who>", "dataShared": "<what data>", "risk": "low|medium|high"}
  ],
  "concerns": [
    {"title": "<concern title>", "description": "<why this is concerning>", "severity": "warning|critical"}
  ],
  "positives": ["<good practice 1>", "<good practice 2>"],
  "recommendations": ["<user recommendation 1>", "<recommendation 2>"]
}

Privacy Score Guidelines:
- 80-100: Excellent privacy practices, minimal data collection
- 60-79: Good practices with some data collection
- 40-59: Moderate concerns, significant data collection
- 20-39: Poor practices, extensive tracking
- 0-19: Very invasive, consider avoiding`;

export async function POST(request: NextRequest) {
    try {
        const { type, content } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: "Policy content is required" },
                { status: 400 }
            );
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 503 }
            );
        }

        // For URL type, we'd normally fetch the content, but for demo we'll use sample text
        let policyText = content;
        if (type === "url") {
            // In production, you'd fetch and parse the URL
            // For demo, we'll analyze a simulated policy based on the domain
            policyText = generateSamplePolicy(content);
        }

        // Truncate if too long
        if (policyText.length > 30000) {
            policyText = policyText.substring(0, 30000) + "... [truncated]";
        }

        const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: ANALYSIS_PROMPT },
                            { text: `Analyze this privacy policy:\n\n${policyText}` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.9,
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error("No response from AI");
        }

        // Parse JSON response
        let cleanText = textContent.trim();
        if (cleanText.startsWith("```json")) cleanText = cleanText.slice(7);
        if (cleanText.startsWith("```")) cleanText = cleanText.slice(3);
        if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);

        const analysis = JSON.parse(cleanText.trim());

        return NextResponse.json({
            ...analysis,
            analyzedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Privacy analysis error:", error);
        return NextResponse.json(
            { error: "Failed to analyze policy. Please try again." },
            { status: 500 }
        );
    }
}

function generateSamplePolicy(url: string): string {
    const domain = url.replace(/https?:\/\//, "").split("/")[0];

    return `
Privacy Policy for ${domain}

Last updated: January 2024

1. INFORMATION WE COLLECT

We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.

Personal Information:
- Name and email address
- Phone number
- Billing and shipping address
- Payment information
- Date of birth
- Profile photos

Automatically Collected Information:
- IP address and device information
- Browser type and settings
- Cookies and tracking technologies
- Location data (GPS, WiFi, Bluetooth)
- Usage data and browsing history
- Advertising identifiers

2. HOW WE USE YOUR INFORMATION

We use the information we collect to:
- Provide and improve our services
- Personalize your experience
- Send marketing communications
- Conduct analytics and research
- Comply with legal obligations
- Prevent fraud and abuse

3. INFORMATION SHARING

We may share your information with:
- Service providers and business partners
- Advertising networks and analytics companies
- Social media platforms
- Affiliated companies
- Law enforcement when required
- Third parties in case of merger or acquisition

4. COOKIES AND TRACKING

We use cookies, pixels, and similar technologies to:
- Track your browsing activity
- Deliver targeted advertising
- Measure ad effectiveness
- Remember your preferences
- Enable social media features

5. DATA RETENTION

We retain your personal information for as long as your account is active or as needed to provide services. Some data may be retained indefinitely for analytics purposes.

6. YOUR RIGHTS

Depending on your location, you may have rights to:
- Access your personal data
- Request deletion of your data
- Opt-out of marketing
- Object to processing

7. SECURITY

We implement reasonable security measures to protect your information, but no method of transmission over the Internet is 100% secure.

8. CHANGES TO THIS POLICY

We may update this policy at any time. Continued use of our services constitutes acceptance of changes.

9. CONTACT US

For privacy inquiries, contact: privacy@${domain}
`;
}
