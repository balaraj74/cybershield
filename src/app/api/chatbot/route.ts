/**
 * AI Chatbot API - Cybersecurity assistant powered by Gemini
 */
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are CyberShield AI, a friendly and knowledgeable cybersecurity assistant. Your role is to:

1. Answer questions about cybersecurity, privacy, and digital safety
2. Provide practical, actionable advice
3. Explain complex security concepts in simple terms
4. Help users understand and protect against cyber threats
5. Recommend best practices for online safety

Guidelines:
- Be helpful, professional, and reassuring
- Use bullet points and clear formatting
- Provide step-by-step guidance when appropriate
- Include relevant examples
- Warn about dangers but don't cause panic
- Stay focused on cybersecurity topics
- If asked about unrelated topics, politely redirect to security matters

Format your responses with:
- **Bold** for important terms
- Bullet points for lists
- Clear sections for long answers`;

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
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

        const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: SYSTEM_PROMPT },
                            { text: `User question: ${message}` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 1024,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return NextResponse.json({
            response: textContent || "I apologize, but I couldn't generate a response. Please try again.",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Chatbot error:", error);
        return NextResponse.json(
            { error: "Failed to process your request" },
            { status: 500 }
        );
    }
}
