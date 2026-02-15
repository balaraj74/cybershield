"use client";

import { useEffect, useState, useCallback } from "react";
import { EyeOff, RefreshCw, CheckCircle, XCircle, Shield, Database, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

export default function PrivacyAIPage() {
    const [report, setReport] = useState<any>(null);
    const [policy, setPolicy] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`${FASTAPI_URL}/api/v1/modules/privacy/report`);
            if (res.ok) {
                const data = await res.json();
                setReport(data.report);
                setPolicy(data.policy);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const privacyScore = report?.privacy_score ?? 0;
    const scoreColor = privacyScore >= 80 ? "text-emerald-400" : privacyScore >= 60 ? "text-yellow-400" : "text-red-400";

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Privacy-Preserving AI</h1>
                    <p className="mt-1 text-neutral-500">On-device inference • PII scrubbing • Differential privacy</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Privacy Score */}
            <Card variant="elevated" className="border-emerald-500/20">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-neutral-500 mb-1">Privacy Score</p>
                            <p className={`text-5xl font-bold ${scoreColor}`}>{privacyScore}</p>
                            <p className="text-xs text-neutral-600 mt-1">out of 100</p>
                        </div>
                        <div className="space-y-1.5 text-right">
                            {report?.compliance_status?.on_device_inference && (
                                <div className="flex items-center justify-end gap-1.5">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-xs text-neutral-400">On-device inference only</span>
                                </div>
                            )}
                            {report?.compliance_status?.pii_scrubbing_active && (
                                <div className="flex items-center justify-end gap-1.5">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-xs text-neutral-400">PII scrubbing active</span>
                                </div>
                            )}
                            {report?.compliance_status?.differential_privacy && (
                                <div className="flex items-center justify-end gap-1.5">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-xs text-neutral-400">Differential privacy enabled</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Processing + Privacy Policy */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Database className="h-4 w-4 text-orange-400" />
                            Data Processing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                ["Total Data Points", report?.total_data_points],
                                ["PII Scrubbed", report?.pii_scrubbed],
                                ["Fields Anonymized", report?.fields_anonymized],
                                ["Retained Locally", report?.data_retained_locally],
                                ["Sent to Cloud", report?.data_sent_to_cloud],
                            ].map(([label, value]) => (
                                <div key={String(label)} className="flex items-center justify-between border-b border-neutral-800/50 pb-2 last:border-0">
                                    <span className="text-sm text-neutral-500">{label}</span>
                                    <span className="text-sm font-semibold text-white">{value ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Lock className="h-4 w-4 text-amber-400" />
                            Privacy Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {policy && (
                            <div className="space-y-3">
                                {Object.entries(policy).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between border-b border-neutral-800/50 pb-2 last:border-0">
                                        <span className="text-sm text-neutral-500">
                                            {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                                        </span>
                                        {typeof val === "boolean" ? (
                                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${val ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-700/50 text-neutral-600"}`}>
                                                {val ? "ON" : "OFF"}
                                            </span>
                                        ) : (
                                            <span className="text-sm font-semibold text-white">{String(val)}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* GDPR Compliance Status */}
            {report?.compliance_status && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="h-4 w-4 text-emerald-400" />
                            GDPR Compliance Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {Object.entries(report.compliance_status).map(([key, val]) => (
                                <div key={key} className={`rounded-lg border p-3 ${val ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {val ? (
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                                        )}
                                        <span className={`text-xs font-bold ${val ? "text-emerald-400" : "text-red-400"}`}>
                                            {val ? "PASS" : "FAIL"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400">
                                        {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
