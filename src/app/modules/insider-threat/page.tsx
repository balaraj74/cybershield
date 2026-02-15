"use client";

import { useEffect, useState, useCallback } from "react";
import { UserX, RefreshCw, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

interface Alert {
    alert_id: string;
    user_id: string;
    threat_type: string;
    severity: string;
    confidence: number;
    risk_score: number;
    indicators: string[];
    recommended_action: string;
    timestamp: string;
}

const sevColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-orange-500/20 text-blue-400 border-orange-500/30",
};

const typeLabels: Record<string, string> = {
    after_hours_access: "After-Hours Access",
    bulk_download: "Bulk Download",
    privilege_escalation: "Privilege Escalation",
    unusual_data_transfer: "Unusual Transfer",
    geographic_anomaly: "Geographic Anomaly",
};

export default function InsiderThreatPage() {
    const [stats, setStats] = useState<any>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [sRes, aRes, pRes] = await Promise.all([
                fetch(`${FASTAPI_URL}/api/v1/modules/insider-threat/stats`),
                fetch(`${FASTAPI_URL}/api/v1/modules/insider-threat/alerts`),
                fetch(`${FASTAPI_URL}/api/v1/modules/insider-threat/profiles`),
            ]);
            if (sRes.ok) setStats((await sRes.json()).stats);
            if (aRes.ok) setAlerts((await aRes.json()).alerts || []);
            if (pRes.ok) setProfiles((await pRes.json()).profiles || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Insider Threat Detection</h1>
                    <p className="mt-1 text-neutral-500">After-hours access • Bulk downloads • Privilege escalation</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Total Alerts</p>
                        <p className="text-2xl font-bold text-white">{stats?.total_alerts || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Users Monitored</p>
                        <p className="text-2xl font-bold text-orange-400">{stats?.users_monitored || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">High Risk Users</p>
                        <p className="text-2xl font-bold text-red-400">{stats?.high_risk_users || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-500 mb-1">Threat Types</p>
                        <p className="text-2xl font-bold text-indigo-400">{stats?.by_type ? Object.keys(stats.by_type).length : 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Type Breakdown */}
            {stats?.by_type && Object.keys(stats.by_type).length > 0 && (
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle className="text-base">Threat Type Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {Object.entries(stats.by_type).map(([type, count]) => (
                                <div key={type} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-center">
                                    <p className="text-lg font-bold text-white">{count as number}</p>
                                    <p className="text-[10px] text-neutral-500 uppercase">{typeLabels[type] || type}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alerts List */}
            <Card variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="h-4 w-4 text-indigo-400" />
                        Insider Threat Alerts
                    </CardTitle>
                    <span className="text-xs text-neutral-600">{alerts.length} alerts</span>
                </CardHeader>
                <CardContent>
                    {alerts.length === 0 ? (
                        <div className="py-12 text-center">
                            <Shield className="h-12 w-12 text-emerald-400/30 mx-auto mb-3" />
                            <p className="text-neutral-500 text-sm">No insider threat alerts detected</p>
                            <p className="text-neutral-600 text-xs mt-1">User behavior appears normal</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div key={alert.alert_id} className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${sevColors[alert.severity] || sevColors.low}`}>
                                                {alert.severity}
                                            </span>
                                            <span className="text-xs font-medium text-neutral-400">
                                                {typeLabels[alert.threat_type] || alert.threat_type}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-neutral-600">Risk: {alert.risk_score}</span>
                                    </div>
                                    <p className="text-sm text-white mb-1">User: {alert.user_id}</p>
                                    {alert.indicators.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {alert.indicators.map((ind, i) => (
                                                <span key={i} className="rounded bg-neutral-800/80 px-2 py-0.5 text-[10px] text-neutral-500">{ind}</span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-neutral-600">Action: {alert.recommended_action}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* User Profiles */}
            {profiles.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">User Behavior Profiles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {profiles.map((p, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                                    <div>
                                        <p className="text-sm font-medium text-white">{p.user_id}</p>
                                        <p className="text-[10px] text-neutral-600">Events: {p.events || 0}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${(p.risk_score || 0) > 70 ? "text-red-400" : (p.risk_score || 0) > 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                                            {p.risk_score ?? 0}
                                        </p>
                                        <p className="text-[10px] text-neutral-600 capitalize">{p.risk_level || "normal"}</p>
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
