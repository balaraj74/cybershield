/**
 * Supabase Database Seed Script
 * Run this to populate the database with sample threat analysis data
 */

const SUPABASE_URL = "https://areondvaeynrnrstozrd.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Sample threat data to seed
const threatAnalyses = [
    {
        input_hash: "hash_email_001",
        input_type: "email",
        threat_type: "phishing",
        severity: "critical",
        risk_score: 92,
        confidence: 0.95,
        summary: "Phishing attempt detected - suspicious sender impersonating bank",
        explanation: JSON.stringify([
            { title: "Sender Analysis", content: "Email sender domain mimics legitimate bank but uses suspicious TLD" },
            { title: "Content Analysis", content: "Contains urgent language and requests for sensitive information" }
        ]),
        indicators: JSON.stringify([
            { type: "suspicious_link", value: "https://secure-bank-login.xyz", severity: "critical" },
            { type: "impersonation", value: "Bank of America Security Team", severity: "high" }
        ]),
        recommendations: JSON.stringify([
            "Do not click any links in this email",
            "Report to your IT security team",
            "Mark as phishing in your email client"
        ]),
        risk_contributions: JSON.stringify([
            { factor: "Suspicious Domain", weight: 35 },
            { factor: "Urgency Language", weight: 25 },
            { factor: "Credential Request", weight: 40 }
        ]),
        processing_time_ms: 245,
        model_version: "1.0.0"
    },
    {
        input_hash: "hash_url_002",
        input_type: "url",
        threat_type: "malware",
        severity: "high",
        risk_score: 78,
        confidence: 0.88,
        summary: "Malware distribution site detected",
        explanation: JSON.stringify([
            { title: "Domain Analysis", content: "Recently registered domain with no reputation history" },
            { title: "Content Analysis", content: "Page attempts to download executable file automatically" }
        ]),
        indicators: JSON.stringify([
            { type: "malware_download", value: "setup.exe", severity: "critical" },
            { type: "new_domain", value: "Registered 3 days ago", severity: "high" }
        ]),
        recommendations: JSON.stringify([
            "Avoid visiting this URL",
            "If visited, run a full system scan",
            "Block domain in firewall"
        ]),
        risk_contributions: JSON.stringify([
            { factor: "Auto-download Attempt", weight: 45 },
            { factor: "New Domain", weight: 30 },
            { factor: "No SSL Certificate", weight: 25 }
        ]),
        processing_time_ms: 189,
        model_version: "1.0.0"
    },
    {
        input_hash: "hash_msg_003",
        input_type: "message",
        threat_type: "social_engineering",
        severity: "high",
        risk_score: 85,
        confidence: 0.91,
        summary: "Social engineering attack - CEO fraud attempt",
        explanation: JSON.stringify([
            { title: "Impersonation Detection", content: "Message claims to be from CEO requesting urgent wire transfer" },
            { title: "Behavioral Analysis", content: "Request bypasses normal approval workflows" }
        ]),
        indicators: JSON.stringify([
            { type: "impersonation", value: "CEO Identity", severity: "critical" },
            { type: "urgency", value: "Immediate action required", severity: "high" },
            { type: "financial_request", value: "Wire transfer $50,000", severity: "critical" }
        ]),
        recommendations: JSON.stringify([
            "Verify request through official channels",
            "Never bypass approval processes",
            "Report to security team immediately"
        ]),
        risk_contributions: JSON.stringify([
            { factor: "Executive Impersonation", weight: 40 },
            { factor: "Financial Request", weight: 35 },
            { factor: "Urgency Tactics", weight: 25 }
        ]),
        processing_time_ms: 156,
        model_version: "1.0.0"
    },
    {
        input_hash: "hash_email_004",
        input_type: "email",
        threat_type: "spam",
        severity: "low",
        risk_score: 25,
        confidence: 0.82,
        summary: "Marketing spam detected - no immediate threat",
        explanation: JSON.stringify([
            { title: "Content Analysis", content: "Promotional content with unsubscribe option" },
            { title: "Sender Reputation", content: "Known marketing sender with mixed reputation" }
        ]),
        indicators: JSON.stringify([
            { type: "bulk_sender", value: "Marketing platform", severity: "low" },
            { type: "tracking_pixels", value: "3 tracking pixels detected", severity: "low" }
        ]),
        recommendations: JSON.stringify([
            "Unsubscribe if unwanted",
            "No immediate action required"
        ]),
        risk_contributions: JSON.stringify([
            { factor: "Bulk Sender", weight: 60 },
            { factor: "Tracking", weight: 40 }
        ]),
        processing_time_ms: 98,
        model_version: "1.0.0"
    },
    {
        input_hash: "hash_url_005",
        input_type: "url",
        threat_type: "credential_theft",
        severity: "critical",
        risk_score: 95,
        confidence: 0.97,
        summary: "Credential harvesting page detected - fake login form",
        explanation: JSON.stringify([
            { title: "Visual Analysis", content: "Page mimics Microsoft 365 login exactly" },
            { title: "Form Analysis", content: "Login credentials sent to external server" }
        ]),
        indicators: JSON.stringify([
            { type: "fake_login", value: "Microsoft 365 impersonation", severity: "critical" },
            { type: "data_exfiltration", value: "Credentials sent to attacker server", severity: "critical" }
        ]),
        recommendations: JSON.stringify([
            "Do not enter any credentials",
            "If credentials entered, change password immediately",
            "Enable MFA on all accounts"
        ]),
        risk_contributions: JSON.stringify([
            { factor: "Brand Impersonation", weight: 35 },
            { factor: "Credential Harvesting", weight: 45 },
            { factor: "Data Exfiltration", weight: 20 }
        ]),
        processing_time_ms: 312,
        model_version: "1.0.0"
    },
    {
        input_hash: "hash_msg_006",
        input_type: "message",
        threat_type: "safe",
        severity: "safe",
        risk_score: 5,
        confidence: 0.99,
        summary: "Message appears safe - normal business communication",
        explanation: JSON.stringify([
            { title: "Content Analysis", content: "Standard business communication without suspicious elements" },
            { title: "Sender Verification", content: "Verified internal sender" }
        ]),
        indicators: JSON.stringify([]),
        recommendations: JSON.stringify([
            "No action required",
            "Message is safe to respond to"
        ]),
        risk_contributions: JSON.stringify([]),
        processing_time_ms: 67,
        model_version: "1.0.0"
    },
    {
        input_hash: "hash_email_007",
        input_type: "email",
        threat_type: "phishing",
        severity: "high",
        risk_score: 82,
        confidence: 0.89,
        summary: "Spear phishing detected - targeted attack",
        explanation: JSON.stringify([
            { title: "Personalization", content: "Email contains personal details about recipient" },
            { title: "Attachment Analysis", content: "Contains macro-enabled document" }
        ]),
        indicators: JSON.stringify([
            { type: "malicious_attachment", value: "invoice.docm", severity: "critical" },
            { type: "personalization", value: "Uses recipient's job title and company", severity: "high" }
        ]),
        recommendations: JSON.stringify([
            "Do not open attachment",
            "Contact sender through separate channel to verify",
            "Report to security team"
        ]),
        risk_contributions: JSON.stringify([
            { factor: "Malicious Attachment", weight: 50 },
            { factor: "Targeted Content", weight: 30 },
            { factor: "Urgency", weight: 20 }
        ]),
        processing_time_ms: 278,
        model_version: "1.0.0"
    },
    {
        input_hash: "hash_url_008",
        input_type: "url",
        threat_type: "data_exfiltration",
        severity: "medium",
        risk_score: 55,
        confidence: 0.75,
        summary: "Suspicious data collection form detected",
        explanation: JSON.stringify([
            { title: "Form Analysis", content: "Collects excessive personal information" },
            { title: "Privacy Analysis", content: "No clear privacy policy or data handling disclosure" }
        ]),
        indicators: JSON.stringify([
            { type: "excessive_data_collection", value: "SSN, DOB, Address requested", severity: "high" },
            { type: "no_privacy_policy", value: "Missing privacy disclosure", severity: "medium" }
        ]),
        recommendations: JSON.stringify([
            "Verify legitimacy of website",
            "Avoid providing sensitive information",
            "Report if suspicious"
        ]),
        risk_contributions: JSON.stringify([
            { factor: "Data Collection", weight: 55 },
            { factor: "Missing Privacy Policy", weight: 25 },
            { factor: "Unknown Operator", weight: 20 }
        ]),
        processing_time_ms: 201,
        model_version: "1.0.0"
    }
];

// Generate dates for the past 7 days
function getRandomDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    return date.toISOString();
}

async function seedDatabase() {
    console.log("🌱 Starting database seed...\n");

    // Insert threat analyses
    for (let i = 0; i < threatAnalyses.length; i++) {
        const analysis = {
            ...threatAnalyses[i],
            analyzed_at: getRandomDate(7),
        };

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/threat_analyses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify(analysis)
            });

            if (response.ok) {
                console.log(`✅ Inserted: ${analysis.threat_type} - ${analysis.severity}`);
            } else {
                const error = await response.text();
                console.log(`❌ Failed: ${analysis.threat_type} - ${error}`);
            }
        } catch (error) {
            console.error(`❌ Error: ${error}`);
        }
    }

    console.log("\n✨ Database seed complete!");
}

// Export for use
export { seedDatabase, threatAnalyses };

// Run if called directly
seedDatabase();
