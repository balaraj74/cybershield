/**
 * Privacy Policy Analyzer - AI reads privacy policies and summarizes risks
 */
"use client";

import { useState } from "react";
import { FileText, Shield, AlertTriangle, Check, Loader2, Eye, Lock, X, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PrivacyAnalysis {
    overallRisk: "low" | "medium" | "high" | "critical";
    privacyScore: number;
    summary: string;
    dataCollected: { type: string; purpose: string; risk: "low" | "medium" | "high" }[];
    thirdPartySharing: { partner: string; dataShared: string; risk: "low" | "medium" | "high" }[];
    concerns: { title: string; description: string; severity: "warning" | "critical" }[];
    positives: string[];
    recommendations: string[];
}

export default function PrivacyAnalyzerPage() {
    const [url, setUrl] = useState("");
    const [policyText, setPolicyText] = useState("");
    const [activeTab, setActiveTab] = useState<"url" | "text">("url");
    const [analysis, setAnalysis] = useState<PrivacyAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState("");

    const analyzePolicy = async () => {
        setError("");
        setIsAnalyzing(true);

        try {
            const response = await fetch("/api/privacy-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: activeTab,
                    content: activeTab === "url" ? url : policyText,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setAnalysis(data);
            }
        } catch (err) {
            setError("Failed to analyze policy. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case "low": return "text-emerald-400 bg-emerald-500/20";
            case "medium": return "text-yellow-400 bg-yellow-500/20";
            case "high": return "text-orange-400 bg-orange-500/20";
            case "critical": return "text-red-400 bg-red-500/20";
            default: return "text-slate-400 bg-slate-500/20";
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-yellow-400";
        if (score >= 40) return "text-orange-400";
        return "text-red-400";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                    <FileText className="h-7 w-7 text-cyan-400" />
                    AI Privacy Policy Analyzer
                </h1>
                <p className="mt-1 text-slate-400">
                    Let AI read the fine print and summarize privacy risks in plain language
                </p>
            </div>

            {/* Input Card */}
            <Card variant="elevated">
                <CardContent className="py-6">
                    {/* Tabs */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setActiveTab("url")}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "url"
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                        >
                            <Globe className="h-4 w-4" />
                            Website URL
                        </button>
                        <button
                            onClick={() => setActiveTab("text")}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "text"
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            Paste Policy Text
                        </button>
                    </div>

                    {/* Input */}
                    {activeTab === "url" ? (
                        <div className="space-y-4">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/privacy-policy"
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <p className="text-xs text-slate-500">
                                Enter the privacy policy URL of any website
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea
                                value={policyText}
                                onChange={(e) => setPolicyText(e.target.value)}
                                placeholder="Paste the privacy policy text here..."
                                rows={8}
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Paste the full privacy policy text</span>
                                <span>{policyText.length} characters</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="mt-4 text-center text-sm text-red-400">{error}</p>
                    )}

                    <Button
                        onClick={analyzePolicy}
                        disabled={(!url && !policyText) || isAnalyzing}
                        className="mt-4 w-full"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                AI is reading the policy...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Analyze with AI
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results */}
            {analysis && (
                <>
                    {/* Score Overview */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card variant="elevated">
                            <CardContent className="py-6 text-center">
                                <div className={`text-5xl font-bold ${getScoreColor(analysis.privacyScore)}`}>
                                    {analysis.privacyScore}
                                </div>
                                <div className="mt-1 text-sm text-slate-400">Privacy Score</div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className={`h-full ${analysis.privacyScore >= 80 ? "bg-emerald-500" :
                                                analysis.privacyScore >= 60 ? "bg-yellow-500" :
                                                    analysis.privacyScore >= 40 ? "bg-orange-500" : "bg-red-500"
                                            }`}
                                        style={{ width: `${analysis.privacyScore}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardContent className="py-6 text-center">
                                <div className={`inline-flex rounded-full px-4 py-2 text-lg font-bold uppercase ${getRiskColor(analysis.overallRisk)}`}>
                                    {analysis.overallRisk} Risk
                                </div>
                                <div className="mt-2 text-sm text-slate-400">Overall Assessment</div>
                            </CardContent>
                        </Card>

                        <Card variant="elevated">
                            <CardContent className="py-6 text-center">
                                <div className="flex justify-center gap-4">
                                    <div>
                                        <div className="text-3xl font-bold text-white">
                                            {analysis.dataCollected.length}
                                        </div>
                                        <div className="text-xs text-slate-400">Data Types</div>
                                    </div>
                                    <div className="h-full w-px bg-slate-700" />
                                    <div>
                                        <div className="text-3xl font-bold text-white">
                                            {analysis.thirdPartySharing.length}
                                        </div>
                                        <div className="text-xs text-slate-400">3rd Parties</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-cyan-400" />
                                Plain English Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
                        </CardContent>
                    </Card>

                    {/* Concerns */}
                    {analysis.concerns.length > 0 && (
                        <Card variant="elevated" className="border-red-500/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    Privacy Concerns
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analysis.concerns.map((concern, index) => (
                                        <div key={index} className="flex items-start gap-3 rounded-lg bg-red-500/10 p-3">
                                            <X className="h-5 w-5 shrink-0 text-red-400" />
                                            <div>
                                                <div className="font-medium text-red-300">{concern.title}</div>
                                                <div className="text-sm text-red-200/70">{concern.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Positives */}
                    {analysis.positives.length > 0 && (
                        <Card variant="elevated" className="border-emerald-500/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-emerald-400">
                                    <Check className="h-5 w-5" />
                                    What They Do Right
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {analysis.positives.map((positive, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-emerald-300">
                                            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                                            {positive}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Data Collected */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-cyan-400" />
                                Data They Collect
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
                                            <th className="pb-2 font-medium">Data Type</th>
                                            <th className="pb-2 font-medium">Purpose</th>
                                            <th className="pb-2 font-medium">Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {analysis.dataCollected.map((data, index) => (
                                            <tr key={index} className="border-b border-slate-800">
                                                <td className="py-2 text-white">{data.type}</td>
                                                <td className="py-2 text-slate-400">{data.purpose}</td>
                                                <td className="py-2">
                                                    <span className={`rounded px-2 py-0.5 text-xs ${getRiskColor(data.risk)}`}>
                                                        {data.risk}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-cyan-400" />
                                AI Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {analysis.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                                        {rec}
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
