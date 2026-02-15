"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, RefreshCw, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

const frameworkLabels: Record<string, string> = {
    iso27001: "ISO 27001:2013",
    gdpr: "EU GDPR",
    indian_it_act: "Indian IT Act",
    soc2: "SOC 2 Type II",
};

const frameworkIcons: Record<string, string> = {
    iso27001: "🛡️",
    gdpr: "🇪🇺",
    indian_it_act: "🇮🇳",
    soc2: "📋",
};

export default function CompliancePage() {
    const [summary, setSummary] = useState<any>(null);
    const [reports, setReports] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [sumRes, repRes] = await Promise.all([
                fetch(`${FASTAPI_URL}/api/v1/modules/compliance/summary`),
                fetch(`${FASTAPI_URL}/api/v1/modules/compliance/reports`),
            ]);
            if (sumRes.ok) setSummary((await sumRes.json()).compliance);
            if (repRes.ok) setReports(await repRes.json());
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const overallScore = summary?.overall_score || 0;
    const scoreColor = overallScore >= 80 ? "text-emerald-400" : overallScore >= 60 ? "text-yellow-400" : "text-red-400";

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Compliance Automation</h1>
                    <p className="mt-1 text-neutral-500">ISO 27001 • GDPR • Indian IT Act • SOC 2</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Overall Score */}
            <Card variant="elevated">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-neutral-500 mb-1">Overall Compliance Score</p>
                            <p className={`text-5xl font-bold ${scoreColor}`}>{overallScore.toFixed(0)}%</p>
                            <p className="text-xs text-neutral-600 mt-1">
                                {summary?.total_passed || 0} passed / {summary?.total_controls || 0} total controls
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-emerald-400">{summary?.total_passed || 0}</p>
                                <p className="text-[10px] text-neutral-500">Passed</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-400">{summary?.total_failed || 0}</p>
                                <p className="text-[10px] text-neutral-500">Failed</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Frameworks Grid */}
            {summary?.frameworks && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.entries(summary.frameworks).map(([key, fw]: [string, any]) => {
                        const pct = fw.score;
                        const barColor = pct >= 80 ? "#10b981" : pct >= 60 ? "#eab308" : "#ef4444";
                        return (
                            <Card key={key}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{frameworkIcons[key] || "📋"}</span>
                                            <h3 className="text-sm font-semibold text-white">{fw.name || frameworkLabels[key]}</h3>
                                        </div>
                                        <span className={`text-lg font-bold ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                                            {pct.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-neutral-800 mb-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-neutral-500 mb-3">
                                        <span>{fw.passed} passed</span>
                                        <span>{fw.failed} failed</span>
                                        <span>{fw.total} total</span>
                                    </div>
                                    <button
                                        onClick={() => setExpanded(expanded === key ? null : key)}
                                        className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white transition-colors"
                                    >
                                        {expanded === key ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                        {expanded === key ? "Hide" : "View"} Controls
                                    </button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Expanded Framework Controls */}
            {expanded && reports && reports[expanded] && (
                <Card variant="elevated">
                    <CardHeader className="flex flex-row items-center gap-2">
                        <span className="text-lg">{frameworkIcons[expanded]}</span>
                        <CardTitle className="text-base">{frameworkLabels[expanded] || expanded} Controls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-neutral-800/50">
                            {reports[expanded].checks?.map((check: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        {check.status === "passed" ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                        )}
                                        <div>
                                            <p className="text-sm text-white">{check.control_id}: {check.control_name}</p>
                                            {check.status === "failed" && check.remediation && (
                                                <p className="text-xs text-neutral-500 mt-0.5">💡 {check.remediation}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        {check.automated && (
                                            <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-400">AUTO</span>
                                        )}
                                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${check.status === "passed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                                            {check.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top Gaps */}
            {summary?.top_gaps && summary.top_gaps.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            Top Compliance Gaps
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {summary.top_gaps.map((gap: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-white">{gap.framework} — {gap.control}: {gap.name}</p>
                                        {gap.remediation && (
                                            <p className="text-xs text-neutral-500 mt-1">💡 {gap.remediation}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
