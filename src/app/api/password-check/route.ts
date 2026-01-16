/**
 * Password Security Check API
 * Analyzes password strength and checks against breach databases
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Common weak passwords to check against
const COMMON_PASSWORDS = new Set([
    "password", "123456", "12345678", "qwerty", "abc123", "password1",
    "111111", "1234567", "iloveyou", "adobe123", "admin", "letmein",
    "welcome", "monkey", "login", "princess", "master", "dragon"
]);

// Common patterns
const PATTERNS = {
    keyboard: /qwerty|asdf|zxcv|1234|qazwsx/i,
    repeated: /(.)\1{2,}/,
    sequential: /012|123|234|345|456|567|678|789|890|abc|bcd|cde|def/i,
};

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password || typeof password !== "string") {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        // Analyze password strength
        const analysis = analyzePassword(password);

        // Check for breaches using k-anonymity (Have I Been Pwned API style)
        const breachResult = await checkBreaches(password);

        return NextResponse.json({
            ...analysis,
            breached: breachResult.breached,
            breachCount: breachResult.count,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Password check error:", error);
        return NextResponse.json(
            { error: "Analysis failed" },
            { status: 500 }
        );
    }
}

function analyzePassword(password: string) {
    const checks: { name: string; passed: boolean; message: string }[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    const length = password.length;
    if (length >= 16) {
        score += 30;
        checks.push({ name: "length", passed: true, message: "Excellent length (16+ chars)" });
    } else if (length >= 12) {
        score += 20;
        checks.push({ name: "length", passed: true, message: "Good length (12+ chars)" });
    } else if (length >= 8) {
        score += 10;
        checks.push({ name: "length", passed: true, message: "Minimum length met" });
        suggestions.push("Consider using at least 12 characters for better security");
    } else {
        checks.push({ name: "length", passed: false, message: "Too short (minimum 8 chars)" });
        suggestions.push("Password should be at least 8 characters long");
    }

    // Character variety
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (hasUpper) {
        score += 10;
        checks.push({ name: "uppercase", passed: true, message: "Contains uppercase letters" });
    } else {
        checks.push({ name: "uppercase", passed: false, message: "Missing uppercase letters" });
        suggestions.push("Add uppercase letters (A-Z)");
    }

    if (hasLower) {
        score += 10;
        checks.push({ name: "lowercase", passed: true, message: "Contains lowercase letters" });
    } else {
        checks.push({ name: "lowercase", passed: false, message: "Missing lowercase letters" });
        suggestions.push("Add lowercase letters (a-z)");
    }

    if (hasNumber) {
        score += 10;
        checks.push({ name: "numbers", passed: true, message: "Contains numbers" });
    } else {
        checks.push({ name: "numbers", passed: false, message: "Missing numbers" });
        suggestions.push("Add numbers (0-9)");
    }

    if (hasSpecial) {
        score += 15;
        checks.push({ name: "special", passed: true, message: "Contains special characters" });
    } else {
        checks.push({ name: "special", passed: false, message: "Missing special characters" });
        suggestions.push("Add special characters (!@#$%^&*)");
    }

    // Common password check
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        score = Math.max(0, score - 40);
        checks.push({ name: "common", passed: false, message: "This is a commonly used password" });
        suggestions.push("Avoid common passwords - this one appears in many breach databases");
    }

    // Pattern checks
    if (PATTERNS.keyboard.test(password)) {
        score = Math.max(0, score - 15);
        checks.push({ name: "pattern", passed: false, message: "Contains keyboard pattern" });
        suggestions.push("Avoid keyboard patterns like 'qwerty' or '1234'");
    }

    if (PATTERNS.repeated.test(password)) {
        score = Math.max(0, score - 10);
        checks.push({ name: "repeated", passed: false, message: "Contains repeated characters" });
        suggestions.push("Avoid repeating the same character multiple times");
    }

    // Entropy bonus
    const uniqueChars = new Set(password).size;
    const charsetSize = (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasNumber ? 10 : 0) + (hasSpecial ? 32 : 0);
    const entropy = length * Math.log2(Math.max(charsetSize, 1));

    if (entropy > 60) score += 15;
    else if (entropy > 40) score += 10;
    else if (entropy > 28) score += 5;

    // Cap score
    score = Math.min(100, Math.max(0, score));

    // Determine strength level
    let strength: "weak" | "fair" | "good" | "strong" | "excellent";
    if (score < 30) strength = "weak";
    else if (score < 50) strength = "fair";
    else if (score < 70) strength = "good";
    else if (score < 90) strength = "strong";
    else strength = "excellent";

    // Estimate crack time
    const crackTime = estimateCrackTime(password, charsetSize);

    return {
        score,
        strength,
        crackTime,
        checks,
        suggestions,
    };
}

function estimateCrackTime(password: string, charsetSize: number): string {
    // Assuming 10 billion attempts per second (modern GPU cluster)
    const attemptsPerSecond = 10_000_000_000;
    const combinations = Math.pow(charsetSize, password.length);
    const seconds = combinations / (attemptsPerSecond * 2); // Average case

    if (seconds < 1) return "Instantly";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
    if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
    if (seconds < 3153600000000) return `${Math.round(seconds / 3153600000)} millennia`;
    return "Centuries+";
}

async function checkBreaches(password: string): Promise<{ breached: boolean; count: number }> {
    try {
        // Create SHA-1 hash of password
        const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);

        // Check against Have I Been Pwned API using k-anonymity
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: {
                "User-Agent": "CyberShield-Password-Checker",
            },
        });

        if (!response.ok) {
            console.error("HIBP API error:", response.status);
            return { breached: false, count: 0 };
        }

        const text = await response.text();
        const lines = text.split("\n");

        for (const line of lines) {
            const [hashSuffix, count] = line.split(":");
            if (hashSuffix?.trim() === suffix) {
                return { breached: true, count: parseInt(count?.trim() || "1", 10) };
            }
        }

        return { breached: false, count: 0 };
    } catch (error) {
        console.error("Breach check error:", error);
        return { breached: false, count: 0 };
    }
}
