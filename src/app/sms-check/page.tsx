/**
 * SMS Scam Detector - Analyze text messages for scam/phishing patterns
 */
"use client";

import { useState } from "react";
import { MessageSquare, Shield, AlertTriangle, Check, Loader2, Phone, Sparkles, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SMSAnalysis {
    isScam: boolean;
    confidence: number;
    scamType: string;
    riskLevel: "safe" | "low" | "medium" | "high" | "critical";
    redFlags: { flag: string; explanation: string }[];
    extractedLinks: { url: string; safe: boolean }[];
    extractedPhones: string[];
    aiSummary: string;
    advice: string[];
}

export default function SMSDetectorPage() {
    const [message, setMessage] = useState("");
    const [analysis, setAnalysis] = useState<SMSAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState("");

    const sampleMessages = [
        "Congratulations! You've won $1,000,000! Click here to claim: bit.ly/win123",
        "Your package is held at customs. Pay $3.99 to release: track24.xyz/pay",
        "ALERT: Your bank account is locked. Verify now: secure-bank-login.com",
        "Hi! Thanks for your order. Your delivery is scheduled for tomorrow between 2-4 PM."
    ];

    const analyzeMessage = async () => {
        if (!message.trim()) {
            setError("Please enter a message to analyze");
            return;
        }

        setError("");
        setIsAnalyzing(true);

        try {
            const response = await fetch("/api/sms-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setAnalysis(data);
            }
        } catch (err) {
            setError("Failed to analyze message. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case "safe": return "text-emerald-400";
            case "low": return "text-blue-400";
            case "medium": return "text-yellow-400";
            case "high": return "text-orange-400";
            case "critical": return "text-red-400";
            default: return "text-slate-400";
        }
    };

    const getRiskBg = (level: string) => {
        switch (level) {
            case "safe": return "bg-emerald-500/20";
            case "low": return "bg-blue-500/20";
            case "medium": return "bg-yellow-500/20";
            case "high": return "bg-orange-500/20";
            case "critical": return "bg-red-500/20";
            default: return "bg-slate-500/20";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                    <MessageSquare className="h-7 w-7 text-cyan-400" />
                    SMS Scam Detector
                </h1>
                <p className="mt-1 text-slate-400">
                    AI-powered detection for SMS phishing, scam, and fraud messages
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-cyan-400" />
                            Paste SMS Message
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <textarea
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                setError("");
                                setAnalysis(null);
                            }}
                            placeholder="Paste the suspicious SMS message here..."
                            rows={6}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />

                        <div className="flex gap-2">
                            <Button
                                onClick={analyzeMessage}
                                disabled={!message.trim() || isAnalyzing}
                                className="flex-1"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Detect Scam
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setMessage("");
                                    setAnalysis(null);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {error && (
                            <p className="text-center text-sm text-red-400">{error}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Sample Messages */}
                <Card variant="elevated">
                    <CardHeader>
                        <CardTitle className="text-base">Try Sample Messages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {sampleMessages.map((sample, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setMessage(sample);
                                    setAnalysis(null);
                                }}
                                className="w-full rounded-lg bg-slate-800 p-3 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700"
                            >
                                {sample.length > 80 ? sample.substring(0, 80) + "..." : sample}
                            </button>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Results */}
            {analysis && (
                <>
                    {/* Status Card */}
                    <Card
                        variant="elevated"
                        className={analysis.isScam ? "border-red-500/50" : "border-emerald-500/50"}
                    >
                        <CardContent className="py-8">
                            <div className="flex flex-col items-center text-center">
                                {analysis.isScam ? (
                                    <>
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
                                            <AlertTriangle className="h-10 w-10 text-red-400" />
                                        </div>
                                        <h2 className="mt-4 text-2xl font-bold text-red-400">
                                            ⚠️ Scam Detected!
                                        </h2>
                                        <p className="mt-2 text-slate-400">
                                            This message appears to be a <span className="font-bold text-white">{analysis.scamType}</span>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                                            <Check className="h-10 w-10 text-emerald-400" />
                                        </div>
                                        <h2 className="mt-4 text-2xl font-bold text-emerald-400">
                                            Message Appears Safe
                                        </h2>
                                        <p className="mt-2 text-slate-400">
                                            No scam patterns detected
                                        </p>
                                    </>
                                )}

                                <div className="mt-4 flex items-center gap-4">
                                    <span className={`rounded-full px-4 py-1 text-sm font-bold uppercase ${getRiskColor(analysis.riskLevel)} ${getRiskBg(analysis.riskLevel)}`}>
                                        {analysis.riskLevel}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        {analysis.confidence}% confidence
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Summary */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-cyan-400" />
                                AI Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-300 leading-relaxed">{analysis.aiSummary}</p>
                        </CardContent>
                    </Card>

                    {/* Red Flags */}
                    {analysis.redFlags.length > 0 && (
                        <Card variant="elevated" className="border-red-500/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    Red Flags Detected ({analysis.redFlags.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analysis.redFlags.map((flag, index) => (
                                        <div key={index} className="rounded-lg bg-red-500/10 p-3">
                                            <div className="font-medium text-red-300">{flag.flag}</div>
                                            <div className="mt-1 text-sm text-red-200/70">{flag.explanation}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Extracted Links */}
                    {analysis.extractedLinks.length > 0 && (
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="text-base">Links in Message</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {analysis.extractedLinks.map((link, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
                                            <span className="font-mono text-sm text-slate-300">{link.url}</span>
                                            <span className={link.safe ? "text-emerald-400" : "text-red-400"}>
                                                {link.safe ? "Likely safe" : "Suspicious"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Advice */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-cyan-400" />
                                What You Should Do
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {analysis.advice.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                        <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
