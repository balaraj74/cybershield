"use client";

import { useEffect, useState, useCallback } from "react";
import { Gauge, Shield, RefreshCw, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

export default function RiskScorePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`${FASTAPI_URL}/api/v1/modules/risk-score/current`);
            if (res.ok) setData(await res.json());
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const score = data?.risk?.score ?? 0;
    const level = data?.risk?.level || "low";
    const levelColors: Record<string, string> = {
        low: "text-emerald-400",
        medium: "text-yellow-400",
        high: "text-orange-400",
        critical: "text-red-400",
    };

    // SVG gauge arc
    const radius = 50;
    const circumference = Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const gaugeColor = level === "low" ? "#10b981" : level === "medium" ? "#eab308" : level === "high" ? "#f97316" : "#ef4444";

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Risk Score Dashboard</h1>
                    <p className="mt-1 text-neutral-500">Simple 0-100 risk score for business owners</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Main Score Card */}
            <Card variant="elevated" className="border-neutral-700/50">
                <CardContent className="p-6">
                    <div className="flex items-center gap-8">
                        {/* Gauge */}
                        <div className="flex-shrink-0">
                            <svg width="120" height="70" viewBox="0 0 120 70" className="overflow-visible">
                                <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                                <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke={gaugeColor} strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${circumference}`} strokeDashoffset={`${offset}`}
                                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                                <text x="60" y="55" textAnchor="middle" className="text-3xl font-bold" fill={gaugeColor}>{score}</text>
                                <text x="60" y="68" textAnchor="middle" className="text-[10px]" fill="#64748b">/ 100</text>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className={`text-lg font-bold uppercase ${levelColors[level] || "text-white"}`}>{level} RISK</p>
                            <p className="text-sm text-neutral-500 mt-1">
                                Security Health: <span className="font-medium text-white">{data?.risk?.health || "No devices monitored"}</span>
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                    <p className="text-xl font-bold text-white">{data?.risk?.devices ?? 0}</p>
                                    <p className="text-[10px] text-neutral-500">Total Devices</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-orange-400">{data?.risk?.at_risk ?? 0}</p>
                                    <p className="text-[10px] text-neutral-500">At Risk</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-red-400">{data?.risk?.critical ?? 0}</p>
                                    <p className="text-[10px] text-neutral-500">Critical</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            {data?.risk?.categories && Object.keys(data.risk.categories).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Risk Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(data.risk.categories).map(([cat, val]: [string, any]) => (
                                <div key={cat} className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-400 capitalize">{cat.replace(/_/g, " ")}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-32 rounded-full bg-neutral-800">
                                            <div className="h-2 rounded-full bg-orange-500 transition-all" style={{ width: `${Math.min(val, 100)}%` }} />
                                        </div>
                                        <span className="text-sm font-medium text-white w-8 text-right">{val}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    {data?.risk?.recommendations && data.risk.recommendations.length > 0 ? (
                        <ul className="space-y-2">
                            {data.risk.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-neutral-500">Connect your first device to start monitoring</p>
                    )}
                </CardContent>
            </Card>

            {/* Device Risk Profiles */}
            <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="text-base">Device Risk Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                    {data?.risk?.device_profiles && data.risk.device_profiles.length > 0 ? (
                        <div className="space-y-3">
                            {data.risk.device_profiles.map((dev: any, i: number) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                                    <div>
                                        <p className="text-sm font-medium text-white">{dev.device_name || dev.device_id}</p>
                                        <p className="text-[10px] text-neutral-600">{dev.os || "Unknown OS"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${(dev.score || 0) > 70 ? "text-red-400" : (dev.score || 0) > 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                                            {dev.score ?? 0}
                                        </p>
                                        <p className="text-[10px] text-neutral-600 capitalize">{dev.level || "low"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <Shield className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
                            <p className="text-sm text-neutral-500">No devices have been scored yet</p>
                            <p className="text-xs text-neutral-600 mt-1">Connect an endpoint agent to start scoring</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
