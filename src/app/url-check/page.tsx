/**
 * URL Safety Checker - Check any URL for threats before visiting
 */
"use client";

import { useState } from "react";
import { Link2, Shield, AlertTriangle, Check, Loader2, Globe, Lock, ExternalLink, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface URLAnalysis {
    url: string;
    safe: boolean;
    riskLevel: "safe" | "low" | "medium" | "high" | "critical";
    riskScore: number;
    threats: string[];
    details: {
        domain: string;
        registrationAge: string;
        ssl: boolean;
        redirects: boolean;
        suspiciousPatterns: string[];
    };
    recommendations: string[];
}

export default function URLCheckerPage() {
    const [url, setUrl] = useState("");
    const [analysis, setAnalysis] = useState<URLAnalysis | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState("");

    const checkURL = async () => {
        if (!url) {
            setError("Please enter a URL");
            return;
        }

        setError("");
        setIsChecking(true);

        try {
            const response = await fetch("/api/url-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setAnalysis(data);
            }
        } catch (err) {
            setError("Failed to analyze URL. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case "safe": return "text-emerald-400 bg-emerald-500/20";
            case "low": return "text-blue-400 bg-blue-500/20";
            case "medium": return "text-yellow-400 bg-yellow-500/20";
            case "high": return "text-orange-400 bg-orange-500/20";
            case "critical": return "text-red-400 bg-red-500/20";
            default: return "text-slate-400 bg-slate-500/20";
        }
    };

    const copyURL = () => {
        navigator.clipboard.writeText(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                    <Link2 className="h-7 w-7 text-cyan-400" />
                    URL Safety Checker
                </h1>
                <p className="mt-1 text-slate-400">
                    Check any link for phishing, malware, or scam before clicking
                </p>
            </div>

            {/* Input Card */}
            <Card variant="elevated">
                <CardContent className="py-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError("");
                                    setAnalysis(null);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && checkURL()}
                                placeholder="https://example.com or paste any suspicious link..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        </div>

                        {error && (
                            <p className="text-center text-sm text-red-400">{error}</p>
                        )}

                        <Button
                            onClick={checkURL}
                            disabled={!url || isChecking}
                            className="w-full py-6 text-lg"
                        >
                            {isChecking ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing URL...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-5 w-5" />
                                    Check URL Safety
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {analysis && (
                <>
                    {/* Status Card */}
                    <Card
                        variant="elevated"
                        className={analysis.safe ? "border-emerald-500/50" : "border-red-500/50"}
                    >
                        <CardContent className="py-8">
                            <div className="flex flex-col items-center text-center">
                                {analysis.safe ? (
                                    <>
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                                            <Check className="h-10 w-10 text-emerald-400" />
                                        </div>
                                        <h2 className="mt-4 text-2xl font-bold text-emerald-400">
                                            URL Appears Safe
                                        </h2>
                                        <p className="mt-2 text-slate-400">
                                            No immediate threats detected
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
                                            <AlertTriangle className="h-10 w-10 text-red-400" />
                                        </div>
                                        <h2 className="mt-4 text-2xl font-bold text-red-400">
                                            Warning: Potential Threat
                                        </h2>
                                        <p className="mt-2 text-slate-400">
                                            This URL may be dangerous
                                        </p>
                                    </>
                                )}

                                <div className="mt-4 flex items-center gap-2">
                                    <span className={`rounded-full px-4 py-1 text-sm font-bold uppercase ${getRiskColor(analysis.riskLevel)}`}>
                                        {analysis.riskLevel} Risk
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        Score: {analysis.riskScore}/100
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Domain Info */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Globe className="h-5 w-5 text-cyan-400" />
                                    Domain Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Domain</span>
                                    <span className="font-mono text-white">{analysis.details.domain}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Domain Age</span>
                                    <span className="text-white">{analysis.details.registrationAge}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">SSL Certificate</span>
                                    <span className={analysis.details.ssl ? "text-emerald-400" : "text-red-400"}>
                                        {analysis.details.ssl ? "Valid HTTPS" : "Not Secure"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Redirects</span>
                                    <span className={analysis.details.redirects ? "text-yellow-400" : "text-emerald-400"}>
                                        {analysis.details.redirects ? "Yes (Suspicious)" : "No"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Threats Found */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                    Detected Issues
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analysis.threats.length > 0 ? (
                                    <ul className="space-y-2">
                                        {analysis.threats.map((threat, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <X className="h-4 w-4 shrink-0 text-red-400" />
                                                <span className="text-slate-300">{threat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="flex items-center gap-2 text-sm text-emerald-400">
                                        <Check className="h-4 w-4" />
                                        No threats detected
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recommendations */}
                    {analysis.recommendations.length > 0 && (
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-cyan-400" />
                                    Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
