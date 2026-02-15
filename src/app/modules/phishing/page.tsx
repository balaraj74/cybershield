"use client";

import { useEffect, useState, useCallback } from "react";
import { Fish, Link2, Mail, Search, RefreshCw, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

export default function PhishingPage() {
    const [stats, setStats] = useState<any>(null);
    const [tab, setTab] = useState<"url" | "email">("url");
    const [inputValue, setInputValue] = useState("");
    const [result, setResult] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [sRes, hRes] = await Promise.all([
                fetch(`${FASTAPI_URL}/api/v1/modules/phishing/stats`),
                fetch(`${FASTAPI_URL}/api/v1/modules/phishing/history`),
            ]);
            if (sRes.ok) setStats((await sRes.json()).stats);
            if (hRes.ok) setHistory((await hRes.json()).history || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAnalyze = async () => {
        if (!inputValue.trim()) return;
        setAnalyzing(true);
        setResult(null);
        try {
            const endpoint = tab === "url" ? "analyze-url" : "analyze-email";
            const body = tab === "url" ? { url: inputValue.trim() } : { email_content: inputValue.trim() };
            const res = await fetch(`${FASTAPI_URL}/api/v1/modules/phishing/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
                fetchData();
            }
        } catch { /* ignore */ }
        setAnalyzing(false);
    };

    const riskColors: Record<string, string> = {
        safe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        suspicious: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        dangerous: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Phishing Detection</h1>
                    <p className="mt-1 text-neutral-500">URL analysis • Email NLP • Brand impersonation detection</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Total Analyzed</p>
                        <p className="text-2xl font-bold text-white">{stats?.total_analyzed || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Phishing Detected</p>
                        <p className="text-2xl font-bold text-red-400">{stats?.phishing_detected || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">URLs Checked</p>
                        <p className="text-2xl font-bold text-orange-400">{stats?.urls_checked || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Emails Checked</p>
                        <p className="text-2xl font-bold text-amber-400">{stats?.emails_checked || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Switch */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setTab("url"); setResult(null); setInputValue(""); }}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === "url" ? "bg-orange-500/20 text-teal-300 border border-teal-500/50" : "bg-neutral-800/50 text-neutral-500 border border-neutral-700/50 hover:bg-neutral-700/50"}`}
                >
                    <Link2 className="h-4 w-4" /> URL Analysis
                </button>
                <button
                    onClick={() => { setTab("email"); setResult(null); setInputValue(""); }}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${tab === "email" ? "bg-orange-500/20 text-teal-300 border border-teal-500/50" : "bg-neutral-800/50 text-neutral-500 border border-neutral-700/50 hover:bg-neutral-700/50"}`}
                >
                    <Mail className="h-4 w-4" /> Email Analysis
                </button>
            </div>

            {/* Analysis Form */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="text-base">
                        {tab === "url" ? "Check URL for Phishing" : "Analyze Email Content"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        {tab === "url" ? (
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                                placeholder="Enter URL to analyze (e.g. http://g00gle-login.xyz/verify)"
                                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                            />
                        ) : (
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Paste email content to analyze..."
                                rows={3}
                                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
                            />
                        )}
                        <Button onClick={handleAnalyze} disabled={analyzing || !inputValue.trim()} className="self-end">
                            <Search className="mr-2 h-4 w-4" /> {analyzing ? "Analyzing..." : "Analyze"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Result */}
            {result && (
                <Card variant="glass" className={result.is_phishing ? "border-red-500/30" : "border-emerald-500/30"}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {result.is_phishing ? (
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                ) : (
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                )}
                                <p className="text-lg font-bold text-white">
                                    {result.is_phishing ? "Phishing Detected!" : "Looks Safe"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{result.score}/100</span>
                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${riskColors[result.risk_level] || riskColors.safe}`}>
                                    {result.risk_level}
                                </span>
                            </div>
                        </div>
                        {result.indicators && result.indicators.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {result.indicators.map((ind: string, i: number) => (
                                    <span key={i} className="rounded bg-neutral-800/80 px-2 py-0.5 text-xs text-neutral-400">{ind}</span>
                                ))}
                            </div>
                        )}
                        {result.recommendation && (
                            <p className="text-sm text-neutral-500">{result.recommendation}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <p className="text-sm text-neutral-500 text-center py-8">No analyses yet — try checking a URL or email above</p>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {item.target_type === "url" ? <Link2 className="h-4 w-4 text-orange-300 flex-shrink-0" /> : <Mail className="h-4 w-4 text-amber-400 flex-shrink-0" />}
                                        <span className="text-sm text-neutral-400 truncate">{item.target}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        <span className="text-xs text-neutral-600">{item.score}/100</span>
                                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${riskColors[item.risk_level] || riskColors.safe}`}>
                                            {item.risk_level}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
